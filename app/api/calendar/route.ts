import {NextRequest} from 'next/server';
import {authorize,errorResponse} from '@/lib/auth';
import {readState,HttpError} from '@/lib/store';
import {calendarFile} from '@/lib/calendar';
import {cardSchema} from '@/lib/schema';
export async function GET(req:NextRequest){try{authorize(req);const p=req.nextUrl.searchParams,c=(await readState()).cards.find(c=>c.id===p.get('id'));if(!c)throw new HttpError(404,'Thought not found');const date=p.get('date')||c.plannedDate||c.dueDate;cardSchema.shape.plannedDate.parse(date);if(!date)throw new HttpError(400,'Choose a date');const time=p.get('time')||null;cardSchema.shape.time.parse(time);const duration=Number(p.get('duration')||30);cardSchema.shape.duration.parse(duration);return new Response(calendarFile(c,date,time,duration),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'attachment; filename="daybook-event.ics"','Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
