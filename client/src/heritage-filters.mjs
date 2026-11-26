export const historicalRelationships=['construction','patronage','addition','restoration','historical_context'];

export function historicalQuery(empireId,state='',relationship=''){
 const query=new URLSearchParams({empires:String(empireId)});
 if(state)query.set('states',state);
 if(relationship)query.set('relationship',relationship);
 return query.toString();
}
