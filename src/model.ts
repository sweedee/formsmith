export type Point = [number, number, number];
export type Item = { position: Point; turn: number; kind: 'block' | 'socket' | 'instance'; template?: string; input?: string };
export type Template = { id: string; name: string; items: Item[] };
export const key = (p: Point) => p.join(',');
export function transform(p: Point, origin: Point, turn: number): Point {
  let [x,y,z] = p;
  for(let i=0;i<((turn%4)+4)%4;i++) [x,z]=[-z,x];
  return [x+origin[0],y+origin[1],z+origin[2]];
}
export function evaluate(items: Item[], templates: Template[], input: Point[] = [[0,0,0]], stack: string[] = []): Point[] {
  const output = new Map<string,Point>();
  for(const item of items) {
    let shape: Point[];
    if(item.kind==='block') shape=[[0,0,0]];
    else if(item.kind==='socket') shape=input;
    else {
      const id=item.template!;
      if(stack.includes(id)) throw new Error('Circular template dependency.');
      const template=templates.find(t=>t.id===id);
      if(!template) throw new Error('Missing template.');
      let supplied: Point[]=[[0,0,0]];
      if(item.input) supplied=evaluate([{kind:'instance',template:item.input,position:[0,0,0],turn:0}],templates,[[0,0,0]],[...stack,id]);
      shape=evaluate(template.items,templates,supplied,[...stack,id]);
    }
    for(const p of shape) { const q=transform(p,item.position,item.turn); output.set(key(q),q); }
    if(output.size>20000) throw new Error('Shape exceeds the 20,000 voxel preview limit.');
  }
  return [...output.values()];
}
export function compare(actual: Point[], target: Point[]) {
  const a=new Set(actual.map(key)), t=new Set(target.map(key));
  return {missing:target.filter(p=>!a.has(key(p))), extra:actual.filter(p=>!t.has(key(p))), correct:actual.filter(p=>t.has(key(p)))};
}
export function cost(items: Item[], templates: Template[]) {
  const local=new Set<string>();
  function visit(list: Item[]) { for(const i of list) if(i.kind==='instance') for(const id of [i.template,i.input]) if(id&&!local.has(id)) {local.add(id);const t=templates.find(t=>t.id===id);if(t) visit(t.items);} }
  visit(items);
  const direct=items.filter(i=>i.kind==='block').length*10;
  const calls=items.filter(i=>i.kind==='instance').length*2;
  const definitions=[...local].reduce((n,id)=>n+8+(templates.find(t=>t.id===id)?.items.length??0)*2,0);
  return {direct,calls,definitions,total:direct+calls+definitions,local};
}
export const levels: {name:string;target:Point[];hint:string}[] = [
  {name:'01 · Column',target:[[0,0,0],[0,1,0],[0,2,0]],hint:'Build three blocks upward. Try a template with three sockets.'},
  {name:'02 · Staircase',target:[[0,0,0],[1,0,0],[1,1,0],[2,0,0],[2,1,0],[2,2,0]],hint:'Three steps, one shared pattern. Any exact solution counts.'},
  {name:'03 · Twin gates',target:[0,5].flatMap(x=>[[x,0,0],[x,1,0],[x,2,0],[x+1,2,0],[x+2,2,0],[x+2,1,0],[x+2,0,0]] as Point[]),hint:'Two objects share the same structure. Reuse a gate template.'},
  {name:'04 · Spiral',target:Array.from({length:8},(_,y)=>transform([2,0,0],[0,y,0],y)),hint:'Eight floating steps around an axis. Rotate sockets to rotate their input.'}
];

