from PIL import Image, ImageDraw, ImageFilter
import math, random, os

OUT = os.path.abspath('outputs/Bhavya/assets/foreground')
os.makedirs(OUT, exist_ok=True)
W, H, S = 1600, 580, 1
random.seed(17)

def canvas():
    return Image.new('RGBA', (W*S, H*S), (0,0,0,0))
def xy(points): return [(int(x*S), int(y*S)) for x,y in points]
def save(im, name):
    im = im.resize((W,H), Image.Resampling.LANCZOS)
    im.save(os.path.join(OUT, name+'.webp'), 'WEBP', lossless=False, quality=91, method=6)
def poly(draw, pts, color): draw.polygon(xy(pts), fill=color)
def line(draw, pts, fill, width): draw.line(xy(pts), fill=fill, width=int(width*S), joint='curve')
def ellipse(draw, box, fill, outline=None, width=1): draw.ellipse(tuple(int(v*S) for v in box), fill=fill, outline=outline, width=int(width*S))

def gradient_shape(im, pts, top, bottom):
    mask = Image.new('L', im.size, 0); ImageDraw.Draw(mask).polygon(xy(pts), fill=255)
    grad = Image.new('RGBA', (1, im.height)); p = grad.load()
    for y in range(im.height):
        t = y / max(1, im.height-1)
        p[0,y] = tuple(round(top[i]*(1-t)+bottom[i]*t) for i in range(4))
    grad = grad.resize(im.size)
    im.alpha_composite(Image.composite(grad, Image.new('RGBA', im.size), mask))

def grass():
    im=canvas(); d=ImageDraw.Draw(im,'RGBA')
    # A low, uneven bank creates a transparent edge rather than a rectangular image.
    poly(d,[(0,530),(0,470),(90,485),(190,456),(275,480),(385,446),(510,467),(645,438),(760,477),(895,449),(1020,481),(1140,446),(1265,468),(1380,437),(1490,478),(1600,449),(1600,580),(0,580)],(10,21,23,238))
    for x in range(-10,1620,7):
        base=random.randint(470,580); h=random.randint(38,185); lean=random.randint(-45,45)
        c=random.choice([(18,35,32,230),(25,45,39,235),(31,49,39,220),(58,58,40,210)])
        line(d,[(x,base),(x+lean*.38,base-h*.52),(x+lean,base-h)],c,random.randint(2,5))
        if random.random()<.48:
            line(d,[(x+lean*.38,base-h*.52),(x+lean*.38-random.randint(8,25),base-h*.7)],c,2)
    save(im,'grass')

def maple():
    im=canvas(); d=ImageDraw.Draw(im,'RGBA')
    # Branch sweeps in from upper-left and hangs into the frame.
    line(d,[(-60,65),(220,125),(410,203),(630,218),(860,255),(1120,245),(1490,340)],(40,27,25,245),22)
    branches=[ [(-5,115),(120,200),(220,300)],[(180,145),(260,70),(340,8)],[(350,190),(420,115),(470,42)],[(560,220),(650,130),(710,60)],[(765,244),(850,165),(940,97)],[(1000,260),(1090,170),(1150,88)],[(1230,286),(1330,215),(1390,150)],[(235,180),(255,265),(290,332)],[(455,205),(515,285),(545,360)],[(850,245),(865,320),(900,385)]]
    for b in branches: line(d,b,(47,31,27,240),8)
    # Distinct five-lobed maple silhouettes with fine central veins.
    def leaf(cx,cy,r,angle,col):
        pts=[]
        for k in range(21):
            a=angle+2*math.pi*k/21
            mod = .52 if k%4 in (1,2) else (1.0 if k%4==0 else .76)
            pts.append((cx+math.cos(a)*r*mod,cy+math.sin(a)*r*mod*1.08))
        poly(d,pts,col)
        line(d,[(cx,cy),(cx+math.cos(angle)*r*.55,cy+math.sin(angle)*r*.55)],(226,147,102,105),2)
    for _ in range(82):
        x=random.randint(0,1570); y=random.randint(30,420)
        if y < 110 + x*.13 or y > 375: continue
        r=random.randint(15,37)
        leaf(x,y,r,random.random()*6.28,random.choice([(123,54,42,220),(157,68,47,232),(182,87,54,210),(96,47,40,220)]))
    save(im,'maple-branches')

def sakura():
    im=canvas(); d=ImageDraw.Draw(im,'RGBA')
    line(d,[(0,90),(210,145),(420,175),(650,230),(900,242),(1160,308),(1550,325)],(48,34,35,238),17)
    for b in [[(190,140),(220,74),(248,20)],[(370,168),(400,94),(455,36)],[(570,205),(598,130),(650,74)],[(810,237),(850,165),(915,115)],[(1030,270),(1085,196),(1140,142)],[(1280,305),(1330,240),(1390,190)],[(480,185),(475,255),(460,302)],[(900,245),(925,320),(966,360)]]:
        line(d,b,(55,37,39,225),7)
    colors=[(217,149,151,222),(233,173,169,218),(245,192,181,210),(173,111,132,206)]
    for cx,cy in [(165,83),(220,45),(294,124),(405,56),(484,112),(605,95),(682,62),(755,165),(862,126),(955,94),(1033,162),(1138,138),(1222,220),(1355,190),(1455,262),(570,286),(956,340)]:
        for _ in range(25):
            x=cx+random.gauss(0,39); y=cy+random.gauss(0,28); r=random.randint(8,18); col=random.choice(colors)
            for k in range(5):
                a=2*math.pi*k/5
                ellipse(d,(x+math.cos(a)*r*.58-r*.4,y+math.sin(a)*r*.58-r*.34,x+math.cos(a)*r*.58+r*.4,y+math.sin(a)*r*.58+r*.34),col)
            ellipse(d,(x-3,y-3,x+3,y+3),(244,204,150,185))
    save(im,'sakura')

def stones():
    im=canvas(); d=ImageDraw.Draw(im,'RGBA')
    for x,y,rx,ry in [(45,510,110,52),(205,535,138,38),(380,492,86,48),(540,542,145,46),(760,512,115,59),(985,545,154,44),(1200,495,120,55),(1455,535,188,60)]:
        c=random.choice([(30,40,41,248),(38,46,46,248),(45,48,45,246),(56,54,48,238)])
        ellipse(d,(x-rx,y-ry,x+rx,y+ry),c,(86,79,67,120),2)
        for _ in range(18):
            px=x+random.uniform(-rx*.8,rx*.8); py=y+random.uniform(-ry*.7,ry*.7)
            ellipse(d,(px,py,px+random.randint(2,8),py+random.randint(1,4)),(132,119,96,random.randint(24,76)))
        line(d,[(x-rx*.55,y-ry*.32),(x-rx*.1,y-ry*.62),(x+rx*.22,y-ry*.58)],(116,107,91,85),3)
    save(im,'stones')

def wall():
    im=canvas(); d=ImageDraw.Draw(im,'RGBA')
    blocks=[(0,354,330,580),(280,290,625,580),(590,340,875,580),(820,260,1130,580),(1080,323,1370,580),(1335,288,1600,580)]
    for i,(x1,y1,x2,y2) in enumerate(blocks):
        col=[(27,36,38,246),(34,40,40,245),(40,43,41,245)][i%3]
        poly(d,[(x1,y2),(x1,y1+24),(x1+30,y1),(x2-23,y1),(x2,y1+32),(x2,y2)],col)
        for row in range(4):
            yy=y1+40+row*50
            if yy>y2: continue
            line(d,[(x1+8,yy),(x2-7,yy+random.randint(-3,3))],(106,97,79,68),3)
        for _ in range(22):
            px=random.randint(x1+8,x2-8); py=random.randint(y1+20,y2-5)
            ellipse(d,(px,py,px+random.randint(5,14),py+random.randint(2,6)),(132,116,91,random.randint(22,55)))
    save(im,'wall')

def ruins():
    im=canvas(); d=ImageDraw.Draw(im,'RGBA')
    # Broken stone pillars and a fractured lintel.
    for x,y,w,h in [(135,205,92,375),(450,265,80,315),(805,160,106,420),(1205,250,95,330),(1450,182,84,398)]:
        poly(d,[(x,y+28),(x+12,y),(x+w-8,y+8),(x+w,y+29),(x+w-4,y+h),(x+7,y+h)],(34,41,40,244))
        line(d,[(x+12,y+50),(x+w-13,y+47)],(118,104,82,105),3)
        line(d,[(x+w*.5,y+100),(x+w*.48,y+h-20)],(105,100,83,85),4)
    poly(d,[(80,234),(80,192),(270,187),(300,210),(410,226),(450,246),(505,220),(690,206),(735,183),(918,196),(962,221),(1112,206),(1155,239),(1332,212),(1370,192),(1525,204),(1550,248),(1250,278),(1050,264),(860,292),(690,261),(500,280),(310,253)],(39,45,42,242))
    for i in range(30):
        x=random.randint(0,1590); y=random.randint(210,560); r=random.randint(9,35)
        ellipse(d,(x-r,y-r*.45,x+r,y+r*.45),random.choice([(24,36,35,230),(39,46,43,242),(53,54,48,220)]))
    save(im,'ruins')

def bushes():
    im=canvas(); d=ImageDraw.Draw(im,'RGBA')
    for cx,base,rx,ry in [(100,555,150,126),(360,572,190,148),(670,556,155,110),(960,570,210,142),(1320,570,245,160),(1570,557,150,118)]:
        for _ in range(55):
            x=random.gauss(cx,rx*.48); y=random.gauss(base-ry*.52,ry*.34); r=random.randint(22,66)
            col=random.choice([(11,29,26,240),(18,38,31,238),(27,45,33,232),(37,49,36,220),(57,58,39,205)])
            ellipse(d,(x-r,y-r*.7,x+r,y+r*.72),col)
        for _ in range(15):
            x=random.gauss(cx,rx*.48); y=random.gauss(base-ry*.6,ry*.34); r=random.randint(8,20)
            ellipse(d,(x-r,y-r*.5,x+r,y+r*.6),(117,101,61,random.randint(65,120)))
    save(im,'bushes')

def hills():
    im=canvas()
    layers=[([(0,540),(0,382),(160,313),(310,354),(500,260),(660,322),(830,224),(1000,305),(1190,240),(1390,315),(1600,225),(1600,580)],(28,42,48,185),(10,21,27,230)),
            ([(0,545),(0,448),(180,382),(350,427),(540,354),(740,432),(940,333),(1110,416),(1310,358),(1480,425),(1600,365),(1600,580)],(31,44,44,205),(10,21,26,242))]
    for pts,top,bottom in layers: gradient_shape(im,pts,top,bottom)
    save(im,'hills')

def pines():
    im=canvas(); d=ImageDraw.Draw(im,'RGBA')
    for x,base,h in [(92,580,390),(280,570,270),(505,585,355),(735,580,260),(966,585,410),(1180,580,285),(1410,575,380),(1555,580,245)]:
        line(d,[(x,base),(x,base-h)],(25,33,31,245),13)
        for k in range(6):
            yy=base-h*.18-k*h*.125; span=(h*.27)*(1-k*.105)
            pts=[(x,yy-h*.10),(x-span*.55,yy+span*.18),(x-span,yy+span*.38),(x-span*.37,yy+span*.32),(x,yy+span*.65),(x+span*.38,yy+span*.29),(x+span,yy+span*.39),(x+span*.52,yy+span*.12)]
            poly(d,pts,random.choice([(11,27,25,245),(16,33,29,240),(23,40,32,232),(32,47,34,218)]))
            line(d,[(x-span*.58,yy+span*.18),(x,yy+span*.46),(x+span*.58,yy+span*.16)],(87,91,60,95),3)
    save(im,'pines')

def lanterns():
    im=canvas(); d=ImageDraw.Draw(im,'RGBA')
    for x,base,s in [(210,565,1.0),(600,577,.82),(1020,574,1.02),(1410,570,.9)]:
        # stone foot, post, roof, lit shoji box
        ellipse(d,(x-66*s,base-26*s,x+68*s,base+17*s),(24,34,35,245),(90,78,61,110),2)
        poly(d,[(x-9*s,base-25*s),(x-8*s,base-180*s),(x+9*s,base-180*s),(x+9*s,base-25*s)],(32,39,37,245))
        poly(d,[(x-42*s,base-176*s),(x-54*s,base-194*s),(x-39*s,base-208*s),(x+41*s,base-208*s),(x+57*s,base-191*s),(x+40*s,base-176*s)],(27,35,35,250))
        poly(d,[(x-51*s,base-210*s),(x-27*s,base-246*s),(x+28*s,base-246*s),(x+52*s,base-210*s)],(39,42,38,248))
        poly(d,[(x-27*s,base-241*s),(x+27*s,base-241*s),(x+37*s,base-214*s),(x-37*s,base-214*s)],(236,151,69,195))
        for dx in [-22,-8,8,22]: line(d,[(x+dx*s,base-239*s),(x+dx*s,base-216*s)],(68,47,34,220),2)
        ellipse(d,(x-43*s,base-248*s,x+43*s,base-240*s),(31,38,36,255))
        line(d,[(x,base-246*s),(x,base-276*s)],(34,39,36,235),5)
        # amber bloom pixels keep the lantern alive on dark backgrounds
        ellipse(d,(x-27*s,base-236*s,x+27*s,base-219*s),(255,180,92,80))
    save(im,'lanterns')

for f in [grass,maple,sakura,stones,wall,ruins,bushes,hills,pines,lanterns]: f()
print('Generated:', ', '.join(sorted(os.listdir(OUT))))
