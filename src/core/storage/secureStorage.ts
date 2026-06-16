import * as Keychain from "react-native-keychain";

const SERVICE_NAME = "furnispace.auth";

export async function setAccessToken(token: string): Promise<void> {
  await Keychain.setGenericPassword("accessToken", token, { service: SERVICE_NAME });
}

export async function getAccessToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE_NAME });
  return credentials ? credentials.password : null;
}

export async function clearAccessToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE_NAME });
}
