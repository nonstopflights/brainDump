import {createHmac,timingSafeEqual} from 'node:crypto';
import {NextRequest} from 'next/server';
import {HttpError} from './store';
export function equal(a:string,b:string){const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);}
export function sessionToken(expiry:number){return `${expiry}.${createHmac('sha256',process.env.APP_PASSWORD||'local').update(String(expiry)).digest('hex')}`;}
export function sameOrigin(req:NextRequest){const origin=req.headers.get('origin');if(!origin)return true;try{const url=new URL(origin);return ['http:','https:'].includes(url.protocol)&&url.host===req.headers.get('host');}catch{return false;}}
export function authorize(req:NextRequest){const password=process.env.APP_PASSWORD;if(password){const cookie=req.cookies.get('daybook_session')?.value||'';const expiry=Number(cookie.split('.')[0]);if(!expiry||expiry<Date.now()||!equal(cookie,sessionToken(expiry)))throw new HttpError(401,'Sign in to your Daybook');}else {const host=new URL('http://'+(req.headers.get('host')||'invalid')).hostname;if(!['localhost','127.0.0.1','[::1]'].includes(host))throw new HttpError(403,'Set APP_PASSWORD before remote access');}
if(req.method!=='GET'){if(!sameOrigin(req))throw new HttpError(403,'Invalid origin');}}
export function errorResponse(e:unknown){if(e instanceof HttpError)return Response.json({error:e.message},{status:e.status});if(e&&typeof e==='object'&&'issues'in e)return Response.json({error:'Invalid input. Check the dates and required fields.'},{status:400});console.error(e);return Response.json({error:'Could not save. Please try again.'},{status:500});}
