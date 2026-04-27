import {
  type ClaimedDocumentChatJob,
  type DocumentChatEvent,
  completeDocumentChatJob,
  createDocumentChatMessage,
  failDocumentChatJob,
  publishDocumentChatEvent,
} from "@/lib/services/documents/chat";
import { generateAnswerFromDocuments } from "@/lib/services/documents/query";

type GenerateAnswer = typeof generateAnswerFromDocuments;
type PublishEvent = (event: DocumentChatEvent) => Promise<void>;

export class DocumentChatJobProcessor {
  constructor(
    private readonly dependencies: {
      generateAnswer?: GenerateAnswer;
      publishEvent?: PublishEvent;
    } = {},
  ) {}

  async process(job: ClaimedDocumentChatJob) {
    const generateAnswer =
      this.dependencies.generateAnswer ?? generateAnswerFromDocuments;
    const publishEvent =
      this.dependencies.publishEvent ?? publishDocumentChatEvent;

    try {
      const answer = await generateAnswer({
        userId: job.userId,
        question: job.question,
        documentIds: [job.documentId],
      });

      const assistantMessage = await createDocumentChatMessage({
        documentId: job.documentId,
        userId: job.userId,
        role: "assistant",
        content: answer.answer,
      });

      await completeDocumentChatJob(job.id);

      await publishEvent({
        type: "chat.completed",
        jobId: job.id,
        documentId: job.documentId,
        userId: job.userId,
        message: {
          id: assistantMessage.id,
          role: "assistant",
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt.toISOString(),
        },
        matches: answer.matches,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to process chat job.";

      await failDocumentChatJob(job.id, message);
      await publishEvent({
        type: "chat.failed",
        jobId: job.id,
        documentId: job.documentId,
        userId: job.userId,
        error: message,
      });

      throw error;
    }
  }
}
