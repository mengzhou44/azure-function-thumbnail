const Jimp = require('jimp');
const stream = require('stream');
const {
    BlockBlobClient, ContainerClient
} = require("@azure/storage-blob");

const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };

const containerName = process.env.BLOB_CONTAINER_NAME;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

module.exports = async function (context, eventGridEvent, inputBlob) {

    const blobUrl = context.bindingData.data.url;
    const blobName = blobUrl.slice(blobUrl.lastIndexOf("/") + 1);
    const widthInPixels = 100;

    const thumbnail = await Jimp.read(inputBlob);

    if (thumbnail) {

        thumbnail.resize(widthInPixels, Jimp.AUTO);
        thumbnail.getBuffer(Jimp.MIME_JPEG, async (err, buffer) => {
            context.log('step2')
            if (err) {
                context.log('getBuffer error', err.message)
            }
            const readStream = stream.PassThrough();
            readStream.end(buffer);
            context.log('try to connect to storage')
            context.log({
                connectionString,
                containerName,
                blobName
            })
            const blobClient = new BlockBlobClient(connectionString, containerName, blobName);
            context.log('step3')
            try {
                await blobClient.uploadStream(readStream,
                    uploadOptions.bufferSize,
                    uploadOptions.maxBuffers,
                    { blobHTTPHeaders: { blobContentType: "image/jpeg" } });
            } catch (err) {
                context.log('step4', err.message)
                context.log(err.message);
            }
        });
    } else {
        context.log('thumbnail is undefined')
    }
};