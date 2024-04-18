import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const ADAPTER_VERSION = "5"

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
        var value = ""
        if (block.Relationships?.length > 0) {
            var relationshipId = block.Relationships[0].Ids[0];
            var queryResult = queryResults.find((b: any) => b.Id == relationshipId);
            value = queryResult?.Text;
        }
        return { key, value, query: block.Query.Text, confidence: queryResult?.Confidence };
    });
    var nextResult = await readTextractResult(s3Client, bucket, folder, jobId, ++key);
    console.log(nextResult ? [...result, ...nextResult] : result)
    return nextResult ? [...result, ...nextResult] : result;

}

export const calculateMean = (arr: { key: string, value: any, query: string, confidence: number }[]) => {
    arr = arr.filter((r: any) => r.confidence > 0)
    if (arr.length == 0) return 0;
    var confidence = arr.map((r: any) => r.confidence)
        .reduce((a: number, b: number) => a + b) / (arr.length ?? 1)
    return confidence;
}

export const calculateStdDev = (arr: { key: string, value: any, query: string, confidence: number }[]) => {
    arr = arr.filter((r: any) => r.confidence > 0)
    if (arr.length == 0) return 0;
    var mean = calculateMean(arr);
    var stdDev = Math.sqrt(arr
        .map((r: any) => Math.pow((r.confidence) - mean, 2))
        .reduce((a, b) => a + b) / (arr.length ?? 1));
    return stdDev;
}

/***
 * Convert array of key value pair to object
 * Key can be nested object separated by dot it will create proper object structure
 */
export const convertMapToObject = (arr: { key: string, value: any, query: string, confidence: number }[]) => {
    var obj: any = {};
    arr.forEach((r: any) => {
        var keys = r.key.split('.');
        var temp = obj;
        keys.forEach((k: any, i: any) => {
            if (i == keys.length - 1) {
                temp[k] = r.value;
            } else {
                temp[k] = temp[k] ?? {};
                temp = temp[k];
            }
        });
    });
    return obj;
}