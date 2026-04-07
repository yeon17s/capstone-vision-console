// roslibjs 타입이 없으므로 unknown으로 관리; 추후 roslibjs 설치 시 교체
let rosClient: unknown = null;

export function getRosClient(): unknown {
  return rosClient;
}

export function setRosClient(client: unknown): void {
  rosClient = client;
}

export function clearRosClient(): void {
  rosClient = null;
}
