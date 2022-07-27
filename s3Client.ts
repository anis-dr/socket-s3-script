import { S3Client } from '@aws-sdk/client-s3';
import AWS from 'aws-sdk';

const credentials = new AWS.Credentials(
  process.env.ACCESS_KEY_ID as string,
  process.env.SECRET_KEY as string,
);

// Create an Amazon S3 service client object.
export const s3Client = new S3Client({
  region: process.env.REGION,
  endpoint: 'https://s3.amazonaws.com',
  credentials,
});

