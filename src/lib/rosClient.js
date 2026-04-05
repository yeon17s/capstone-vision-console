let rosClient = null;

export function getRosClient() {
  return rosClient;
}

export function setRosClient(client) {
  rosClient = client;
}

export function clearRosClient() {
  rosClient = null;
}
