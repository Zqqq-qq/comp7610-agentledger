from pathlib import Path
from xml.etree import ElementTree as ET
from html import escape
import re,math
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,Preformatted,Flowable,HRFlowable
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4

BASE=Path(__file__).resolve().parent
OUT=BASE/'REPORT.pdf'
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyReview',fontName='Helvetica',fontSize=9.6,leading=14,spaceAfter=6,splitLongWords=True))
styles.add(ParagraphStyle(name='TitleReview',fontName='Helvetica-Bold',fontSize=22,leading=27,spaceAfter=12,textColor=colors.HexColor('#153c31'),keepWithNext=True))
styles.add(ParagraphStyle(name='SectionReview',fontName='Helvetica-Bold',fontSize=14,leading=18,spaceBefore=15,spaceAfter=8,textColor=colors.HexColor('#153c31'),keepWithNext=True))
styles.add(ParagraphStyle(name='SubReview',fontName='Helvetica-Bold',fontSize=11,leading=15,spaceBefore=10,spaceAfter=6,keepWithNext=True))
styles.add(ParagraphStyle(name='TableReview',fontName='Helvetica',fontSize=8.4,leading=11.7,splitLongWords=True))
styles.add(ParagraphStyle(name='CodeReview',fontName='Courier',fontSize=8,leading=11,spaceBefore=5,spaceAfter=9,backColor=colors.HexColor('#f1f4f2'),borderPadding=7))
WIDTH=A4[0]-92

def inline(s):
    stash=[]
    def code(m):
        stash.append('<font name="Courier" size="8">'+escape(m[1])+'</font>')
        return f'ZZCODETOKEN{len(stash)-1}ZZ'
    s=re.sub(r'`([^`]+)`',code,s)
    s=escape(s)
    s=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',lambda m:'<link href="'+m[2]+'" color="#256a50">'+m[1]+'</link>',s)
    for j,c in enumerate(stash):s=s.replace(f'ZZCODETOKEN{j}ZZ',c)
    return s

def para(s,style='BodyReview'):return Paragraph(inline(s),styles[style])

class Diagram(Flowable):
    def __init__(self):
        super().__init__();self.width=WIDTH;self.height=WIDTH*880/1100
    def draw(self):
        c=self.canv;c.saveState();c.scale(self.width/1100,self.width/1100)
        ns='{http://www.w3.org/2000/svg}'
        root=ET.parse(BASE.parent/'assets/architecture.svg').getroot()
        H=880
        for e in root:
            tag=e.tag.replace(ns,'');a=e.attrib
            if tag not in ['rect','text','path']:continue
            fill=a.get('fill');stroke=a.get('stroke')
            c.saveState()
            if fill and fill!='none':c.setFillColor(colors.HexColor(fill))
            if stroke:c.setStrokeColor(colors.HexColor(stroke))
            c.setLineWidth(float(a.get('stroke-width','1')))
            if a.get('stroke-dasharray'):c.setDash([float(v) for v in a['stroke-dasharray'].split()])
            if tag=='rect':
                c.roundRect(float(a['x']) if 'x' in a else 0,H-float(a.get('y',0))-float(a['height']),float(a['width']),float(a['height']),float(a.get('rx',0)),stroke=int(bool(stroke)),fill=int(fill!='none'))
            elif tag=='text':
                c.setFont('Helvetica-Bold' if a.get('font-weight')=='700' else 'Helvetica',float(a.get('font-size',18)))
                c.drawString(float(a['x']),H-float(a['y']),''.join(e.itertext()))
            else:
                t=re.findall(r'[MLHV]|-?\d+(?:\.\d+)?',a['d']);p=c.beginPath();j=0;cmd=None;x=y=0;pts=[]
                while j<len(t):
                    if t[j] in ['M','L','H','V']:cmd=t[j];j+=1
                    if cmd in ['M','L']:
                        x=float(t[j]);y=float(t[j+1]);j+=2
                    elif cmd=='H':x=float(t[j]);j+=1
                    elif cmd=='V':y=float(t[j]);j+=1
                    if cmd=='M':p.moveTo(x,H-y);cmd='L'
                    else:p.lineTo(x,H-y)
                    pts.append((x,H-y))
                c.drawPath(p,stroke=int(bool(stroke)),fill=0)
                if a.get('marker-end') and len(pts)>1:
                    ex,ey=pts[-1];px,py=pts[-2];ang=math.atan2(ey-py,ex-px);n=10
                    c.setDash([]);c.setFillColor(colors.HexColor(stroke));q=c.beginPath();q.moveTo(ex,ey)
                    for off in [2.65,-2.65]:q.lineTo(ex+n*math.cos(ang+off),ey+n*math.sin(ang+off))
                    q.close();c.drawPath(q,stroke=0,fill=1)
            c.restoreState()
        c.restoreState()

lines=(BASE/'REPORT.md').read_text().splitlines();story=[];i=0
while i<len(lines):
    line=lines[i]
    if not line.strip():i+=1;continue
    if line.strip() == '---':
        story.extend([Spacer(1,5),HRFlowable(width='100%',thickness=.5,color=colors.HexColor('#d3ded7')),Spacer(1,5)]);i+=1;continue
    if re.match(r'^\d+\.\s',line):
        story.append(para(line));i+=1;continue
    if line.startswith('```'):
        vals=[];i+=1
        while i<len(lines) and not lines[i].startswith('```'):vals.append(lines[i]);i+=1
        story.append(Preformatted('\n'.join(vals),styles['CodeReview']));i+=1;continue
    if line.startswith('!['):story.extend([Spacer(1,6),Diagram(),Spacer(1,8)]);i+=1;continue
    if line.startswith('|'):
        rows=[]
        while i<len(lines) and lines[i].startswith('|'):
            if not re.match(r'^\|[\s:|\-]+\|$',lines[i]):rows.append([c.strip() for c in lines[i].strip('|').split('|')])
            i+=1
        n=len(rows[0]);widths=([WIDTH*.29,WIDTH*.71] if n==2 else [WIDTH*.24,WIDTH*.38,WIDTH*.38] if n==3 else [WIDTH*.17,WIDTH*.22,WIDTH*.40,WIDTH*.21] if n==4 else [WIDTH/n]*n)
        cells=[[para(('**'+c+'**') if ri==0 else c,'TableReview') for c in r] for ri,r in enumerate(rows)]
        t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT')
        t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e8f0eb')),('GRID',(0,0),(-1,-1),.45,colors.HexColor('#cbd8d0')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7)]))
        story.extend([t,Spacer(1,8)]);continue
    m=re.match(r'^(#{1,3})\s+(.*)$',line)
    if m:
        story.append(para(m[2],['TitleReview','SectionReview','SubReview'][len(m[1])-1]));i+=1;continue
    if line.startswith('- '):story.append(para(line[2:]));i+=1;continue
    vals=[line];i+=1
    while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||```|!\[|- |\d+\.\s|---$)',lines[i]):vals.append(lines[i]);i+=1
    story.append(para(' '.join(vals)))

def page(c,doc):
    c.saveState();w,h=A4
    c.setStrokeColor(colors.HexColor('#d3ded7'));c.line(46,43,w-46,43)
    c.setFont('Helvetica',8);c.setFillColor(colors.HexColor('#5b6c62'))
    c.drawString(46,30,'AgentLedger | COMP7610 | Delivery candidate r2 2026-11-08')
    c.drawRightString(w-46,30,str(doc.page));c.restoreState()

doc=SimpleDocTemplate(str(OUT),pagesize=A4,leftMargin=46,rightMargin=46,topMargin=43,bottomMargin=56,title='AgentLedger: On-chain Collaboration Records and Escrow Settlement',author='COMP7610 project team')
doc.build(story,onFirstPage=page,onLaterPages=page)
print(OUT)
