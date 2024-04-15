import { S3Client } from "@aws-sdk/client-s3";
import { readTextractResult } from "../common/textract.helper";
import { DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";

const s3Client = new S3Client({ region: "ap-southeast-2" });
const dynamoDbClient = new DynamoDBClient({ region: "ap-southeast-2" });


export const handler = async (event: any) => {
    const message = JSON.parse(event.Records[0].Sns.Message)
    console.log(message)
    const resultMap = await readTextractResult(s3Client, "hackathon-textract-results", "results", message.JobId)
    // search in dynamodb using GSI filename-index
    var params: QueryCommandInput = {
        TableName: "document",
        IndexName: "filename-index",
        KeyConditionExpression: "filename = :filename",
        ExpressionAttributeValues: {
            ":filename": { S: message.DocumentLocation.S3ObjectName }
        }
    };
    const getCommand = new QueryCommand(params);
    const queryResponse = await dynamoDbClient.send(getCommand);
    var item = queryResponse.Items![0]
    console.log(item)
    item.status.S = "PARSED";
    item.result = { S: JSON.stringify(resultMap) }

    const input = {
        "Item": {
            ...item
        },
        "TableName": "document"
    };
    const command = new PutItemCommand(input);
    await dynamoDbClient.send(command);
    return resultMap
}