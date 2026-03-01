import path from "node:path";
import { fileURLToPath } from "node:url";

import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

import { normalizeProviderError, providerErrorPayload } from "../lib/provider-error.js";
import { SessionManager } from "../orchestrator/session-manager.js";

type ProtoRealtime = {
  realtime: {
    RealtimeOrchestrator: {
      service: grpc.ServiceDefinition<grpc.UntypedServiceImplementation>;
    };
  };
};

type CreateSessionRequest = {
  mode?: string;
  user_id?: string;
  did_source_url?: string;
};

type InterruptSessionRequest = {
  session_id?: string;
};

type DeleteSessionRequest = {
  session_id?: string;
};

type GetSessionMetricsRequest = {
  session_id?: string;
};

type SessionClientEvent = {
  session_id?: string;
  event_type?: string;
  message?: string;
};

const dirname = path.dirname(fileURLToPath(import.meta.url));
const protoPath = path.resolve(dirname, "../../src/grpc/realtime_orchestrator.proto");

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoRealtime;

export function createGrpcServer(sessionManager: SessionManager) {
  const server = new grpc.Server();

  const orchestratorHandlers: grpc.UntypedServiceImplementation = {
    CreateSession: async (
      call: grpc.ServerUnaryCall<CreateSessionRequest, unknown>,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      try {
        const mode = call.request.mode || "default";
        const userId = call.request.user_id || "anonymous";
        const didSourceUrl = call.request.did_source_url;

        const state = await sessionManager.createSession(mode, userId, didSourceUrl);
        callback(null, {
          session_id: state.id,
          created_at_ms: String(state.createdAtMs),
          mode: state.mode,
          did_stream_id: state.didStreamId || ""
        });
      } catch (error) {
        const providerError = normalizeProviderError(error, "d-id");
        callback({
          code: providerError.status === 401 ? grpc.status.UNAUTHENTICATED : grpc.status.INTERNAL,
          message: JSON.stringify(providerErrorPayload(providerError))
        });
      }
    },

    InterruptSession: (
      call: grpc.ServerUnaryCall<InterruptSessionRequest, unknown>,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      const sessionId = call.request.session_id || "";
      const ok = sessionManager.interruptSession(sessionId);
      callback(null, { ok });
    },

    DeleteSession: (
      call: grpc.ServerUnaryCall<DeleteSessionRequest, unknown>,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      const sessionId = call.request.session_id || "";
      const ok = sessionManager.deleteSession(sessionId);
      callback(null, { ok });
    },

    GetSessionMetrics: (
      call: grpc.ServerUnaryCall<GetSessionMetricsRequest, unknown>,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      const sessionId = call.request.session_id || "";
      const session = sessionManager.getSession(sessionId);
      const metrics = sessionManager.getSessionMetrics(sessionId);
      if (!session || !metrics) {
        callback(null, {
          session_id: sessionId,
          provider: "",
          interrupted: false
        });
        return;
      }

      callback(null, {
        session_id: sessionId,
        created_at_ms: String(metrics.createdAtMs || 0),
        first_token_at_ms: String(metrics.firstTokenAtMs || 0),
        first_tts_byte_at_ms: String(metrics.firstTtsByteAtMs || 0),
        avatar_ready_at_ms: String(metrics.avatarReadyAtMs || 0),
        completed_at_ms: String(metrics.completedAtMs || 0),
        first_token_to_avatar_ms: String(metrics.firstTokenToAvatarMs || 0),
        first_token_to_done_ms: String(metrics.firstTokenToDoneMs || 0),
        interrupted: metrics.interrupted,
        provider: metrics.provider
      });
    },

    StreamSession: (call: grpc.ServerDuplexStream<SessionClientEvent, unknown>) => {
      const runningSessions = new Set<string>();

      const emit = (sessionId: string, eventType: string, payload: unknown) => {
        call.write({
          session_id: sessionId,
          event_type: eventType,
          payload_json: JSON.stringify(payload),
          emitted_at_ms: String(Date.now())
        });
      };

      const handleEvent = async (evt: SessionClientEvent) => {
        const sessionId = evt.session_id || "";
        const eventType = evt.event_type || "";

        if (!sessionId || !eventType) {
          return;
        }

        if (eventType === "session.interrupt") {
          sessionManager.interruptSession(sessionId);
          emit(sessionId, "session.interrupted", { reason: "manual_interrupt" });
          return;
        }

        if (eventType === "session.start") {
          if (runningSessions.has(sessionId)) {
            return;
          }

          runningSessions.add(sessionId);
          try {
            await sessionManager.runSessionPrompt(
              sessionId,
              {
                message: evt.message || "",
                mode: "realtime"
              },
              (outEventType, payload) => emit(sessionId, outEventType, payload)
            );
          } catch (error) {
            const providerError = normalizeProviderError(error, "local-llama");
            emit(sessionId, "session.error", {
              ...providerErrorPayload(providerError)
            });
          } finally {
            runningSessions.delete(sessionId);
          }
        }
      };

      call.on("data", (evt) => {
        void handleEvent(evt);
      });

      call.on("error", () => {
        call.end();
      });

      call.on("end", () => {
        call.end();
      });
    }
  };

  server.addService(proto.realtime.RealtimeOrchestrator.service, orchestratorHandlers);
  return server;
}
