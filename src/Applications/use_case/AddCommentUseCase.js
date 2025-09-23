const NewComment = require('../../Domains/comments/entities/NewComment');

class AddCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, threadId, owner) {
    const newComment = new NewComment(useCasePayload);
    await this._threadRepository.verifyThreadExists(threadId);
    return this._commentRepository.addComment(newComment, threadId, owner);
  }
}

module.exports = AddCommentUseCase;
