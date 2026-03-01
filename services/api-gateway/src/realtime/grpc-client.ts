import path from "node:path";
import { fileURLToPath } from "node:url";

import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

export type RealtimeServerEvent = {
  session_id: string;
  event_type: string;
  payload_json: string;
  emitted_at_ms: string;
};

type CreateSessionRequest = {
  mode?: string;
  user_id?: string;
  did_source_url?: string;
};

type CreateSessionResponse = {
  session_id: string;
  created_at_ms: string;
  mode: string;
  did_stream_id: string;
};

type GenericOkResponse = {
  ok: boolean;
};

type MetricsResponse = {
  session_id: string;
  created_at_ms?: string;
  first_token_at_ms?: string;
  first_tts_byte_at_ms?: string;
  avatar_ready_at_ms?: string;
  completed_at_ms?: string;
  first_token_to_avatar_ms?: string;
  first_token_to_done_ms?: string;
  interrupted?: boolean;
  provider?: string;
};

type SessionClientEvent = {
  session_id: string;
  event_type: string;
  message: string;
  request_id: string;
  sent_at_ms: string;
};

type RealtimeOrchestratorClient = grpc.Client & {
  CreateSession: (
    request: CreateSessionRequest,
    callback: (error: grpc.ServiceError | null, response: CreateSessionResponse) => void
  ) => void;
  InterruptSession: (
    request: { session_id: string; reason?: string },
    callback: (error: grpc.ServiceError | null, response: GenericOkResponse) => void
  ) => void;
  DeleteSession: (
    request: { session_id: string },
    callback: (error: grpc.ServiceError | null, response: GenericOkResponse) => void
  ) => void;
  GetSessionMetrics: (
    request: { session_id: string },
    callback: (error: grpc.ServiceError | null, response: MetricsResponse) => void
  ) => void;
  StreamSession: () => grpc.ClientDuplexStream<SessionClientEvent, RealtimeServerEvent>;
};

type ProtoRealtime = {
  realtime: {
    RealtimeOrchestrator: new (address: string, creds: grpc.ChannelCredentials) => RealtimeOrchestratorClient;
  };
};

const dirname = path.dirname(fileURLToPath(import.meta.url));
const protoPath = path.resolve(dirname, "../../src/realtime/realtime_orchestrator.proto");

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoRealtime;

export function createRealtimeGrpcClient(address: string): RealtimeOrchestratorClient {
  return new proto.realtime.RealtimeOrchestrator(address, grpc.credentials.createInsecure());
}

export async function createSession(
  client: RealtimeOrchestratorClient,
  request: CreateSessionRequest
): Promise<CreateSessionResponse> {
  return new Promise((resolve, reject) => {
    client.CreateSession(request, (error, response) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(response);
    });
  });
}

export async function interruptSession(client: RealtimeOrchestratorClient, sessionId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    client.InterruptSession({ session_id: sessionId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(Boolean(response?.ok));
    });
  });
}

export async function deleteSession(client: RealtimeOrchestratorClient, sessionId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    client.DeleteSession({ session_id: sessionId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(Boolean(response?.ok));
    });
  });
}

export async function getSessionMetrics(client: RealtimeOrchestratorClient, sessionId: string): Promise<MetricsResponse> {
  return new Promise((resolve, reject) => {
    client.GetSessionMetrics({ session_id: sessionId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(response || { session_id: sessionId });
    });
  });
}

export function createStream(client: RealtimeOrchestratorClient) {
  return client.StreamSession();
}
