export type Kind = 'task' | 'note' | 'event';
export type Status = 'open' | 'done' | 'cancelled' | 'archived';
export type Doc = { type: string; [key: string]: unknown };
export type Attachment = {id: string; name: string; type: string; size: number};
export type Card = {
 id: string; title: string; kind: Kind; status: Status; content: Doc; plainText: string;
 tags: string[]; collectionId: string | null; plannedDate: string | null; dueDate: string | null;
 time: string | null; duration: number; reminder: string | null; recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
 priority: boolean; focus: boolean; deferred: boolean; energy: 'any' | 'low' | 'medium' | 'high'; effort: number | null;
 nextAction: string; attachments: Attachment[]; createdAt: string; updatedAt: string;
 journalDate: string; history: {at:string; action:string; from?:string; to?:string}[];
};
export type Tag = {id:string; name:string; color:string; aliases:string[]; archived:boolean};
export type Collection = {id:string; name:string};
export type ViewPreferences = {today:boolean; journal:boolean; future:boolean};
export const defaultViewPreferences:ViewPreferences = {today:true,journal:true,future:true};
export type State = {cards:Card[]; tags:Tag[]; collections:Collection[]; boardTags:string[]; reflections:Record<string,string>; preferences:ViewPreferences; version:number};
export type ParsedCapture = {title:string; kind:Kind; plannedDate:string|null; dueDate:string|null; time:string|null; reminder:string|null; tags:string[]; suggestedTags:string[]; priority:boolean; recurrence:Card['recurrence']; original:string; ambiguous:boolean; engine:'rules'|'model'};
export const palette = ['#a23b72','#2c7a7b','#9a5b13','#6458a6','#327346','#b34f45'];
export function textDoc(text:string):Doc {return {type:'doc',content:text.split('\n').map(line=>({type:'paragraph',content:line?[{type:'text',text:line}]:[]}))};}
export function localDate(date=new Date()) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function formatDate(value:string|null) {if(!value)return '';return new Date(value+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'});}
export function makeCard(p:Partial<Card> = {}):Card {const now=new Date().toISOString();return {id:crypto.randomUUID(),title:'Untitled',kind:'note',status:'open',content:textDoc(''),plainText:'',tags:[],collectionId:null,plannedDate:null,dueDate:null,time:null,duration:30,reminder:null,recurrence:'none',priority:false,focus:false,deferred:false,energy:'any',effort:null,nextAction:'',attachments:[],createdAt:now,updatedAt:now,journalDate:localDate(),history:[],...p};}
