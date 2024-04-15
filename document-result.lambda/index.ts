import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "ap-southeast-2" });

const readDocumentResults = async (bucket: any, jobId: string, key: any): Promise<{ key: string, value: any, query: string }[] | null> => {
    const params = {
        Bucket: "hackathon-textract-results",
        Key: `results/${jobId}/${key}`
    };
    console.log(params)
    var json: any;
    try {
        const data = await s3Client.send(new GetObjectCommand(params));
        json = JSON.parse(await data.Body?.transformToString() ?? "");
    } catch (e) {
        console.error(params, e);
        return null;
    }
    var queries = json.Blocks.filter((b: any) => b.BlockType == "QUERY");
    var queryResults = json.Blocks.filter((b: any) => b.BlockType == "QUERY_RESULT");

    return queries?.map((block: any) => {
        var key = block.Query.Alias;
        var relationshipId = block.Relationships[0].Ids[0];
        var value = queryResults.find((b: any) => b.Id == relationshipId)?.Text;
        return { key, value, query: block.Query.Text };
    });

}

export const handler = async (event: any) => {
    const message = JSON.parse(event.Records[0].Sns.Message)
    var index = 1;
    console.log(message)
    var resultMap: any = [];
    while (true) {
        const result = await readDocumentResults("hackathon-textract-results", message.JobId, index)
        if (!result) {
            break;
        }
        resultMap = [...resultMap, ...result]
        index++;
    }


    console.log(resultMap)
    return resultMap
}