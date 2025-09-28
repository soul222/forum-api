const NewLike = require('../../Domains/likes/entities/NewLike');

class LikeCommentUseCase {
  constructor({ likeRepository, commentRepository, threadRepository }) {
    this._likeRepository = likeRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(threadId, commentId, owner) {
    await this._threadRepository.verifyThreadExists(threadId);
    await this._commentRepository.verifyCommentExists(commentId);

    const isLiked = await this._likeRepository.verifyLikeExists(commentId, owner);

    if (isLiked) {
      // Unlike - remove like
      await this._likeRepository.deleteLike(commentId, owner);
    } else {
      // Like - add like
      const newLike = new NewLike({ commentId, owner });
      await this._likeRepository.addLike(newLike);
    }
  }
}

module.exports = LikeCommentUseCase;
