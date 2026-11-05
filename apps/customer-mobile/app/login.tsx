import { useRouter } from 'expo-router';
import { OtpLogin } from '@busyfrnd/mobile-core';

export default function Login() {
  const router = useRouter();
  return <OtpLogin role="CUSTOMER" onDone={() => router.replace('/')} />;
}
