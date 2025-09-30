const LikeCommentUseCase = require('../../../../Applications/use_case/LikeCommentUseCase');

class LikesHandler {
  constructor(container) {
    this._container = container;

    this.putLikeHandler = this.putLikeHandler.bind(this);
  }

  async putLikeHandler(request) {
    const likeCommentUseCase = this._container.getInstance(LikeCommentUseCase.name);
    const { id: owner } = request.auth.credentials;
    const { threadId, commentId } = request.params;
    await likeCommentUseCase.execute(threadId, commentId, owner);

    return {
      status: 'success',
    };
  }
}

module.exports = LikesHandler;
