import {attribute, hashKey, table} from "@aws/dynamodb-data-mapper-annotations";

@table('clients')
export class Clients {

    @hashKey()
    id: string;

    @attribute()
    client_name: string;

    @attribute()
    user_pool_id:string;

    @attribute()
    user_pool_name:string;

    @attribute()
    client_id:string;

    @attribute({defaultProvider: () => new Date()})
    updated_at: Date;

    @attribute({defaultProvider: () => new Date()})
    created_at: Date;

    @attribute({defaultProvider: () => "SYSTEM"})
    account: string;

}
