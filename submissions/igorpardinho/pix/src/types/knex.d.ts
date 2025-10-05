

import {Knex} from 'knex'

declare module 'knex/types/tables'{
    export interface Tables{
        payouts:{
            id:string;
            external_id:string;
            user_id:string;
            amount_cents:number;
            pix_key:string;
            status:'paid'| 'failed'|'duplicate';
            created_at:'string'
        }
    }
}