import {PrismaClient, screenshots} from '@prisma/client';
import moment from 'moment';

import throat from 'throat';
import {PutObjectCommand} from '@aws-sdk/client-s3';
import {s3Client} from './s3Client';

const prisma = new PrismaClient({
  log: [
    // 'query',
    'info',
    // 'warn',
    // 'error'
  ],
});

const processScreenshot = async (screenshot: screenshots) => {
  if (screenshot.path.startsWith('/2022/')) {
    console.log(`Screenshot ${screenshot.id} is already in S3`);
    return
  }

  const activeWindow = await prisma.active_windows.findUnique({
    where: {
      id: screenshot.activeWindowId,
    }
  });

  if (!activeWindow) {
    console.log(`Screenshot ${screenshot.id} has no active window`);
    return
  }

  const formattedTime = moment(activeWindow.recordedAt).format('HH:mm:ss');
  const dateFolderString = moment(activeWindow.recordedAt).format('YYYY/MM/DD');
  const filePath = `/${dateFolderString}/${activeWindow.id}-${activeWindow.userId}-${undefined}_${formattedTime}.jpg`;

  console.log(`Screenshot ${screenshot.id} will be moved to ${filePath}`);

  // S3 stuff
  const key = `${process.env.BUCKET_FOLDER}${filePath}`;

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: `${key}`,
    Body: screenshotBuffer.data,
  };
  const command = new PutObjectCommand(params);

  try {
    await s3Client.send(command);
    console.log(`Successfully created ${params.Key} and uploaded it to ${params.Bucket}/${params.Key}`);
  } catch (error) {
    console.error(`Error ${error}`);
  }

  return `Screenshot ${screenshot.id} will be moved to ${filePath}`
}

async function main() {
  const options = {
    where: {
      createdAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      }
    }
  }

  const screenshots = await prisma.screenshots.findMany(options);
  const data = Promise.all(
    screenshots.map(throat(10, (screenshot) => processScreenshot(screenshot)))
  );

  console.log(await data);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
