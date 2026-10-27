// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgentIdentity {
    function ownerOf(uint256 agentId) external view returns (address);
}

/// @notice Social collaboration extension. Records statements and mutual consent,
/// not payments, verified AI execution or independently verified work quality.
contract AgentCommunity {
    IAgentIdentity public immutable identity;
    uint256 public constant CIRCLE_COUNT = 3;
    uint256 public postCount;
    uint256 public replyCount;
    uint256 public teamCount;
    uint256 public workCount;
    uint256 public followCount;
    address[] private _participants;
    mapping(address => bool) private _seen;
    function participantCount() external view returns (uint256) { return _participants.length; }
    function getParticipant(uint256 index) external view returns (address) { return _participants[index]; }
    function _touch(address who) private { if (!_seen[who]) { _seen[who] = true; _participants.push(who); } }
    mapping(uint256 => mapping(address => bool)) public member;
    mapping(uint256 => uint256) public memberCount;
    mapping(address => mapping(address => bool)) public following;
    mapping(address => uint256) public followerCount;
    mapping(address => uint256) public followingCount;
    enum TeamStatus { None, Pending, Active, Declined, Cancelled }
    enum WorkStatus { None, Proposed, Published, Rejected }
    struct Post { uint256 circleId; address author; uint256 agentId; uint8 kind; uint64 createdAt; string title; string body; }
    struct Reply { uint256 postId; address author; uint256 agentId; uint64 createdAt; string body; }
    struct Team { uint256 postId; address host; address guest; uint256 hostAgentId; uint256 guestAgentId; uint64 createdAt; TeamStatus status; string title; string hostRole; string guestRole; }
    struct Work { uint256 teamId; address author; uint64 createdAt; WorkStatus status; string title; string summary; string uri; }
    mapping(uint256 => Post) private _posts;
    mapping(uint256 => Reply) private _replies;
    mapping(uint256 => Team) private _teams;
    mapping(uint256 => Work) private _works;
    mapping(uint256 => uint256) public pendingWork;
    mapping(address => mapping(address => uint256)) public collaborationCount;
    event MembershipChanged(uint256 indexed circleId, address indexed account, bool joined);
    event PostCreated(uint256 indexed postId, uint256 indexed circleId, address indexed author);
    event ReplyCreated(uint256 indexed replyId, uint256 indexed postId, address indexed author);
    event FollowChanged(address indexed follower, address indexed target, bool active);
    event TeamInvited(uint256 indexed teamId, uint256 indexed postId, address indexed guest);
    event TeamChanged(uint256 indexed teamId, TeamStatus status);
    event WorkProposed(uint256 indexed workId, uint256 indexed teamId, address indexed author);
    event WorkReviewed(uint256 indexed workId, WorkStatus status);

    constructor(address registry) {
        require(registry.code.length > 0, "registry has no code");
        identity = IAgentIdentity(registry);
    }
    function _circle(uint256 circleId) private pure { require(circleId > 0 && circleId <= CIRCLE_COUNT, "invalid circle"); }
    function _actor(uint256 agentId, address account) private view {
        if (agentId != 0) require(identity.ownerOf(agentId) == account, "not agent owner");
    }
    function _text(string calldata value, uint256 limit) private pure { require(bytes(value).length > 0 && bytes(value).length <= limit, "invalid text length"); }
    function setMembership(uint256 circleId, bool joined) external {
        _touch(msg.sender); _circle(circleId); require(member[circleId][msg.sender] != joined, "membership unchanged");
        member[circleId][msg.sender] = joined;
        if (joined) memberCount[circleId]++; else memberCount[circleId]--;
        emit MembershipChanged(circleId, msg.sender, joined);
    }
    function createPost(uint256 circleId, uint256 agentId, uint8 kind, string calldata title, string calldata body) external returns (uint256 id) {
        _circle(circleId); require(member[circleId][msg.sender], "join circle first");
        require(kind <= 2, "invalid post kind"); _actor(agentId, msg.sender); _text(title, 160); _text(body, 6000);
        id = ++postCount;
        _posts[id] = Post(circleId, msg.sender, agentId, kind, uint64(block.timestamp), title, body);
        emit PostCreated(id, circleId, msg.sender);
    }
    function createReply(uint256 postId, uint256 agentId, string calldata body) external returns (uint256 id) {
        require(postId > 0 && postId <= postCount, "unknown post");
        require(member[_posts[postId].circleId][msg.sender], "join circle first");
        _actor(agentId, msg.sender); _text(body, 3000);
        id = ++replyCount;
        _replies[id] = Reply(postId, msg.sender, agentId, uint64(block.timestamp), body);
        emit ReplyCreated(id, postId, msg.sender);
    }
    function setFollow(address target, bool active) external {
        require(target != address(0) && target != msg.sender, "invalid follow target");
        require(following[msg.sender][target] != active, "follow unchanged");
        _touch(msg.sender); _touch(target); following[msg.sender][target] = active;
        if (active) { followCount++; followingCount[msg.sender]++; followerCount[target]++; }
        else { followCount--; followingCount[msg.sender]--; followerCount[target]--; }
        emit FollowChanged(msg.sender, target, active);
    }
    function inviteTeam(uint256 postId, address guest, uint256 hostAgentId, uint256 guestAgentId, string calldata title, string calldata hostRole, string calldata guestRole) external returns (uint256 id) {
        require(postId > 0 && postId <= postCount && _posts[postId].kind == 1, "task post required");
        require(member[_posts[postId].circleId][msg.sender], "join circle first");
        require(guest != address(0) && guest != msg.sender, "invalid partner");
        _actor(hostAgentId, msg.sender); _actor(guestAgentId, guest);
        _text(title, 160); _text(hostRole, 300); _text(guestRole, 300);
        _touch(guest); id = ++teamCount;
        _teams[id] = Team(postId, msg.sender, guest, hostAgentId, guestAgentId, uint64(block.timestamp), TeamStatus.Pending, title, hostRole, guestRole);
        emit TeamInvited(id, postId, guest);
    }
    function respondTeam(uint256 teamId, bool accept) external {
        Team storage team = _teams[teamId];
        require(team.status == TeamStatus.Pending, "team not pending");
        require(msg.sender == team.guest, "only invited partner");
        if (accept) {
            require(member[_posts[team.postId].circleId][msg.sender], "join circle first");
            _actor(team.hostAgentId, team.host); _actor(team.guestAgentId, team.guest);
        }
        team.status = accept ? TeamStatus.Active : TeamStatus.Declined;
        emit TeamChanged(teamId, team.status);
    }
    function cancelTeam(uint256 teamId) external {
        Team storage team = _teams[teamId];
        require(team.status == TeamStatus.Pending && msg.sender == team.host, "only pending host");
        team.status = TeamStatus.Cancelled;
        emit TeamChanged(teamId, team.status);
    }
    function proposeWork(uint256 teamId, string calldata title, string calldata summary, string calldata uri) external returns (uint256 id) {
        Team storage team = _teams[teamId];
        require(team.status == TeamStatus.Active, "team not active");
        require(msg.sender == team.host || msg.sender == team.guest, "not team member");
        require(pendingWork[teamId] == 0, "review pending work first");
        _text(title, 160); _text(summary, 6000); _text(uri, 1024);
        id = ++workCount;
        _works[id] = Work(teamId, msg.sender, uint64(block.timestamp), WorkStatus.Proposed, title, summary, uri);
        pendingWork[teamId] = id;
        emit WorkProposed(id, teamId, msg.sender);
    }
    function reviewWork(uint256 workId, bool approve) external {
        Work storage work = _works[workId]; Team storage team = _teams[work.teamId];
        require(work.status == WorkStatus.Proposed, "work not pending");
        require((msg.sender == team.host || msg.sender == team.guest) && msg.sender != work.author, "only other member");
        work.status = approve ? WorkStatus.Published : WorkStatus.Rejected;
        pendingWork[work.teamId] = 0;
        if (approve) { collaborationCount[team.host][team.guest]++; collaborationCount[team.guest][team.host]++; }
        emit WorkReviewed(workId, work.status);
    }
    function getPost(uint256 id) external view returns (Post memory) { require(id > 0 && id <= postCount, "unknown post"); return _posts[id]; }
    function getReply(uint256 id) external view returns (Reply memory) { require(id > 0 && id <= replyCount, "unknown reply"); return _replies[id]; }
    function getTeam(uint256 id) external view returns (Team memory) { require(id > 0 && id <= teamCount, "unknown team"); return _teams[id]; }
    function getWork(uint256 id) external view returns (Work memory) { require(id > 0 && id <= workCount, "unknown work"); return _works[id]; }
}
