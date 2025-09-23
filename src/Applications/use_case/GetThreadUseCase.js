class GetThreadUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await this._replyRepository.getRepliesByCommentId(comment.id);
        return {
          ...comment,
          content: comment.is_delete ? '**komentar telah dihapus**' : comment.content,
          replies: replies.map((reply) => ({
            ...reply,
            content: reply.is_delete ? '**balasan telah dihapus**' : reply.content,
          })),
        };
      }),
    );

    return {
      thread: {
        ...thread,
        comments: commentsWithReplies,
      },
    };
  }
}

module.exports = GetThreadUseCase;
