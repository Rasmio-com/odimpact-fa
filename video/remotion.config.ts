// تنظیمات Remotion CLI (studio / still / render)
import { Config } from '@remotion/cli/config';

// قلم‌ها از همان پوشه‌ی سایت خوانده می‌شوند تا دو نسخه از فایل‌ها نداشته باشیم.
Config.setPublicDir('../site/assets');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);

// اگر Chrome Headless Shell از قبل نصب است، مسیرش را بدهید تا Remotion دانلودش نکند:
//   REMOTION_BROWSER=/path/to/headless_shell npm run render
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
