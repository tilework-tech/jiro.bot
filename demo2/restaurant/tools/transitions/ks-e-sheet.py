from PIL import Image
tts='0,0.14,0.28,0.42,0.56,0.7,0.84,1'.split(',')
S=Image.new('RGB',(960*2+10,(540+10)*4),(20,20,20))
for i,t in enumerate(tts):
  S.paste(Image.open(f'f-{t}.png').convert('RGB'),((i%2)*970,(i//2)*550))
S.save('sheet.png')
