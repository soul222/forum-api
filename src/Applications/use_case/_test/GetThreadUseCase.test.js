class GetThreadUseCase {
  constructor({
    threadRepository, commentRepository, replyRepository, likeRepository,
  }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
    this._likeRepository = likeRepository;
  }

  async execute(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);

    const commentsWithRepliesAndLikes = await Promise.all(
      comments.map(async (comment) => {
        const replies = await this._replyRepository.getRepliesByCommentId(comment.id);
        const likeCount = await this._likeRepository.getLikeCountByCommentId(comment.id);

        return {
          ...comment,
          content: comment.is_delete ? '**komentar telah dihapus**' : comment.content,
          likeCount,
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
        comments: commentsWithRepliesAndLikes,
      },
    };
  }
}

module.exports = GetThreadUseCase;
