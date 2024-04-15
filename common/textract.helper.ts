import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const readTextractResult = async (s3Client: S3Client, bucket: any, folder: string, jobId: string, key: number = 1): Promise<{ key: string, value: any, query: string, confidence: number }[] | null> => {
    const params = {
        Bucket: bucket,
        Key: `${folder}/${jobId}/${key}`
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

    var result = queries?.map((block: any) => {
        var key = block.Query.Alias;
        var relationshipId = block.Relationships[0].Ids[0];
        var queryResult = queryResults.find((b: any) => b.Id == relationshipId);
        var value = queryResult?.Text;
        return { key, value, query: block.Query.Text, confidence: queryResult?.Confidence };
    });
    var nextResult = await readTextractResult(s3Client, bucket, folder, jobId, ++key);
    return nextResult ? [...result, ...nextResult] : result;

}
