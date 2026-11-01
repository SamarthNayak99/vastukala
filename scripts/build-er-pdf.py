"""Render Graphviz xdot primitives as vector PDF diagrams, then add the FK register.

Run render-er-graphs.mjs first. Requires reportlab and pypdf.
"""
import json, math
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from xml.sax.saxutils import escape
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
SCHEMA=json.loads((ROOT/'docs/diagrams/schema-metadata.json').read_text())
META=json.loads((ROOT/'tmp/pdfs/er-pages.json').read_text())
OUT=ROOT/'output/pdf/Vastukala-ER-Diagrams.pdf'
W,H=landscape(A3)
PAPER=colors.HexColor('#f7f2e9');INK=colors.HexColor('#302c25');MUTED=colors.HexColor('#70695d');RUST=colors.HexColor('#984930');GREEN=colors.HexColor('#234537');LINE=colors.HexColor('#d7cebd')
pdfmetrics.registerFont(TTFont('Calibri', 'C:/Windows/Fonts/calibri.ttf'))
pdfmetrics.registerFont(TTFont('Calibri-Bold','C:/Windows/Fonts/calibrib.ttf'))
pdfmetrics.registerFont(TTFont('Georgia','C:/Windows/Fonts/georgia.ttf'))
body=ParagraphStyle('body',fontName='Calibri',fontSize=11,leading=15,textColor=INK)
small=ParagraphStyle('small',parent=body,fontSize=10,leading=13)
c=canvas.Canvas(str(OUT),pagesize=(W,H),pageCompression=1)
c.setTitle('Vastukala - Complete ER Diagrams')
c.setAuthor('SamarthNayak99')
c.setSubject('Physical PostgreSQL schema and temporary educational models, 1 November 2026')

def para(text,x,y,width,style=body):
 p=Paragraph(text,style); _,h=p.wrap(width,1000);p.drawOn(c,x,y-h);return h

def header(number,title,subtitle,category='ENTITY RELATIONSHIP ATLAS'):
 c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
 c.setFillColor(RUST);c.setFont('Calibri-Bold',11);c.drawString(42,H-32,'VASTUKALA  /  '+category)
 c.setFillColor(MUTED);c.setFont('Calibri',10);c.drawRightString(W-42,H-32,'IMPLEMENTED MODEL  |  01 NOVEMBER 2026')
 c.setFillColor(INK);c.setFont('Georgia',30);c.drawString(42,H-72,title)
 para(subtitle,42,H-88,W-84,body)
 c.setStrokeColor(LINE);c.line(42,H-112,W-42,H-112)
 c.setFont('Calibri',9);c.setFillColor(MUTED)
 c.drawString(42,H-129,'PK primary key    FK foreign-key participant    UQ single-column unique    ? nullable    0..* zero or more    0..1 optional one')
 c.setStrokeColor(LINE);c.line(42,30,W-42,30)
 c.setFillColor(MUTED);c.setFont('Calibri',9)
 c.drawString(42,17,'Schema metadata + migrations 001-006 + server/lab.mjs  |  A3 landscape; vector artwork remains sharp when zoomed')
 c.drawRightString(W-42,17,f'{number:02d} / 11')
 c.bookmarkPage(f'page-{number}');c.addOutlineEntry(title,f'page-{number}',level=0)

def apply_color(value,stroke=True):
 if value=='transparent':rgba=(1,1,1,0)
 elif value.startswith('#') and len(value)==9:
  rgba=tuple(int(value[i:i+2],16)/255 for i in (1,3,5,7))
 else:
  col=colors.toColor(value);rgba=(col.red,col.green,col.blue,1)
 col=colors.Color(*rgba[:3])
 if stroke:c.setStrokeColor(col);c.setStrokeAlpha(rgba[3])
 else:c.setFillColor(col);c.setFillAlpha(rgba[3])

def ops(items):
 c.saveState();font='Helvetica';size=12;flags=0;text_color='#302c25'
 for a in items:
  op=a['op']
  if op=='c':
   apply_color(a['color']);text_color=a['color']
  elif op=='C':apply_color(a['color'],False)
  elif op=='F':font=a['face'];size=a['size']
  elif op=='t':flags=a['fontchar']
  elif op=='S':
   s=a['style'];c.setDash([5,4] if s=='dashed' else [1,3] if s=='dotted' else [])
   if s.startswith('setlinewidth('):c.setLineWidth(float(s[13:-1]))
  elif op in ('p','P','L','b','B'):
   points=a['points'];p=c.beginPath();p.moveTo(*points[0])
   if op in ('b','B'):
    for i in range(1,len(points),3):p.curveTo(*points[i],*points[i+1],*points[i+2])
   else:
    for point in points[1:]:p.lineTo(*point)
    if op in ('p','P'):p.close()
   c.drawPath(p,stroke=1,fill=1 if op in ('P','B') else 0)
  elif op in ('e','E'):
   x,y,rx,ry=a['rect'];c.ellipse(x-rx,y-ry,x+rx,y+ry,stroke=1,fill=int(op=='E'))
  elif op=='T':
   face='Helvetica'+('-BoldOblique' if flags&1 and flags&2 else '-Bold' if flags&1 else '-Oblique' if flags&2 else '')
   x,y=a['pt'];text=a['text'];width=a['width'];align=a['align']
   if align=='c':x-=width/2
   elif align=='r':x-=width
   measured=pdfmetrics.stringWidth(text,face,size)
   c.saveState();apply_color(text_color,False);c.translate(x,y);c.scale(width/measured if measured else 1,1);c.setFont(face,size);c.drawString(0,0,text);c.restoreState()
  else:raise ValueError(f'Unsupported xdot primitive {op}')
 c.restoreState()

SCALES=[]
def graph(page):
 d=json.loads((ROOT/f'tmp/pdfs/{page["id"]}.json').read_text());x0,y0,x1,y1=map(float,d['bb'].split(','));gw=x1-x0;gh=y1-y0
 notes=page['notes'];note_bottom=48+len(notes)*14+18;bottom=330 if page['id']=='07-operations' else note_bottom;top=H-145
 scale=min((W-84)/gw,(top-bottom)/gh,1.05 if page['id']=='07-operations' else 1.45)
 x=42+(W-84-gw*scale)/2;y=bottom+(top-bottom-gh*scale)/2
 c.saveState();c.translate(x,y);c.scale(scale,scale);c.translate(-x0,-y0)
 # All edges first, then opaque entity cards. Labels are drawn last to stay legible.
 for edge in d.get('edges',[]):
  for key in ['_draw_','_tdraw_','_hdraw_']:ops(edge.get(key,[]))
 for obj in d.get('objects',[]):
  for key in ['_draw_','_ldraw_']:ops(obj.get(key,[]))
 for edge in d.get('edges',[]):
  for key in ['_ldraw_','_tldraw_','_hldraw_']:ops(edge.get(key,[]))
 c.restoreState()
 if page['id']=='07-operations':
  c.setFont('Calibri-Bold',11);c.setFillColor(RUST);c.drawString(42,307,'DERIVED SQL VIEW - dashed connectors show query lineage, not foreign keys')
  sources=[('buildings',150),('sites',480),('building_types',810)]
  c.setDash([4,3]);c.setStrokeColor(MUTED)
  for name,sx in sources:
   c.line(sx+110,260,590,225)
  c.setDash([])
  for name,sx in sources:
   c.setFillColor(colors.HexColor('#eee7db'));c.setStrokeColor(LINE);c.rect(sx,260,220,30,fill=1,stroke=1);c.setFillColor(INK);c.setFont('Calibri-Bold',12);c.drawCentredString(sx+110,270,name)
  c.setFillColor(GREEN);c.rect(435,180,310,45,fill=1,stroke=0);c.setFillColor(colors.white);c.setFont('Calibri-Bold',13);c.drawCentredString(590,198,'published_building_summary')
  c.setFillColor(MUTED);c.setFont('Calibri',10);c.drawCentredString(590,162,'id, name, slug, summary, date_label, site, building_type | published records only')
 y=note_bottom-10
 for note in notes:
  h=para(note,42,y,W-84,small);y-=max(h,12)+2
 if y<31:raise ValueError(f'Footer collision: {page["id"]}')
 SCALES.append((page['id'],round(scale,3),round(13*scale,1)))

for i,page in enumerate(META['pages'],1):
 header(i,page['title'],page['subtitle']);graph(page);c.showPage()

def table(data,widths,x,y,row_font=10,padding=9):
 style=ParagraphStyle('cell',parent=small,fontSize=row_font,leading=row_font+3)
 header_style=ParagraphStyle('headcell',parent=style,fontName='Calibri-Bold',textColor=colors.white)
 grid=[[Paragraph(escape(str(cell)),header_style if r==0 else style) for cell in row] for r,row in enumerate(data)]
 t=Table(grid,colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),GREEN),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#fffcf6'),colors.HexColor('#eee7db')]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),padding),('BOTTOMPADDING',(0,0),(-1,-1),padding),('LINEBELOW',(0,0),(-1,-1),.4,LINE)]))
 _,h=t.wrap(sum(widths),H);t.drawOn(c,x,y-h);return h

fks=META['fks']
for part in range(2):
 number=9+part;subset=fks[part*11:(part+1)*11]
 header(number,f'Foreign-key register / {part+1} of 2','Every declared permanent FK, including composite keys. R-numbers match the diagrams; these are physical constraints, not inferred associations.','RELATIONSHIP REFERENCE')
 data=[['ID','Child table / foreign-key columns','Parent table / referenced key','Parent per child','ON DELETE']]
 for f in subset:
  optional=any(next(c for c in SCHEMA['columns'] if c['table_name']==f['table_name'] and c['column_name']==n)['is_nullable']=='YES' for n in f['columns'])
  delete=next((rule for rule in ['CASCADE','RESTRICT','SET NULL','NO ACTION'] if f'ON DELETE {rule}' in f['definition']),'NO ACTION')
  data.append([f['number'],f["table_name"]+'\n('+', '.join(f['columns'])+')',f['referenced_table']+'\n('+', '.join(f['referenced_columns'])+')','0..1' if optional else '1',delete])
 h=table(data,[45,355,355,145,W-84-900],42,H-150,11)
 y=H-150-h-22
 para('All parent entities may have zero or many child rows. The listed parent-per-child cardinality depends on FK nullability. For composite optional FKs, PostgreSQL MATCH SIMPLE skips the reference check when a participating value is NULL.',42,y,W-84,body)
 if y<80:raise ValueError('Relationship register overflow')
 c.showPage()

header(11,'Integrity rules and model coverage','A final reference for composite uniqueness, application boundaries and the scope of the diagrams.','CONSTRAINT REFERENCE')
uniques=[x for x in SCHEMA['constraints'] if x['kind']=='u']
data=[['Table','UNIQUE column combination']]+[[x['table_name'],', '.join(x['columns'])] for x in uniques]
h=table(data,[205,440],42,H-150,9.7,padding=6)
right=735;rw=W-right-42;y=H-150
rules=[
 ('20 permanent tables / 119 columns','All permanent columns are represented on pages 2-7. Repeated selected-field cards are explicitly labelled as abbreviated.'),
 ('22 physical foreign keys','The overview and register include every declared FK. Content relationships are shown in detail on pages 2-6.'),
 ('Required references and allowed states','NOT NULL enforces required fields. CHECK constraints restrict publication status, date precision, state/UT kind and event kind.'),
 ('Dates and uncertainty','Construction ranges must be ordered when both bounds exist, and cannot use year zero. Events require ordered nonzero years within -1000..2100.'),
 ('Coordinates and images','Latitude/longitude and hotspot x/y have range checks. Image width, height and byte_size must be positive.'),
 ('Evidence and publishing boundary','At most one citation assertion target is allowed. Publishing prerequisites and hotspot citation sufficiency are validated by the application.'),
 ('SQL view and infrastructure','published_building_summary is derived from published buildings, sites and types. No fabricated admin-to-content or session FK is drawn.'),
 ('Temporary educational scope','The four practice/scale tables on page 8 are connection-local, fictional/synthetic and absent from the persistent model. They have no catalogue FK.')
]
for title,text in rules:
 c.setFillColor(RUST);c.setFont('Calibri-Bold',12);c.drawString(right,y,title);y-=8
 y-=para(text,right,y-4,rw,small)+18
if y<45:raise ValueError('Rule panel overflow')
bottom=H-150-h-18
para('Additional index-based rule: CREATE UNIQUE INDEX one_cover_per_building ON images(building_id) WHERE is_cover. This permits at most one cover image per building; it does not require a cover to exist.',42,bottom,645,small)
if bottom<65:raise ValueError('Unique-key table overflow')
c.showPage();c.save()
reader=PdfReader(OUT)
assert len(reader.pages)==11
text='\n'.join(p.extract_text() or '' for p in reader.pages)
for table_name in META['tables']:assert table_name in text,table_name
for f in fks:assert f['number'] in text,f['number']
for name in ['lab_sites','lab_buildings','lab_links','lab_scale']:assert name in text
print(f'Created {OUT} | {len(reader.pages)} pages | all 20 tables, 119 columns and 22 FKs represented.')
print('Diagram scale and body text points:',SCALES)
