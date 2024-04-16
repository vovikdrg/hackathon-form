import { DynamoDBClient, PutItemCommand, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";

export const findFileRecord = async (dynamoDbClient: DynamoDBClient, fileName: string) => {
    var params: QueryCommandInput = {
        TableName: "document",
        IndexName: "filename-index",
        KeyConditionExpression: "filename = :filename",
        ExpressionAttributeValues: {
            ":filename": { S: fileName }
        }
    };
    const getCommand = new QueryCommand(params);
    return await dynamoDbClient.send(getCommand);
}

export const saveDocument = async (dynamoDbClient: DynamoDBClient, item: any) => {
    const input = {
        "Item": {
            ...item
        },
        "TableName": "document"
    };
    const command = new PutItemCommand(input);
    await dynamoDbClient.send(command);
}