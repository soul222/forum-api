const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const LikeRepository = require('../../../Domains/likes/LikeRepository');
const GetThreadUseCase = require('../GetThreadUseCase');

describe('GetThreadUseCase', () => {
  it('should orchestrating the get thread action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const mockThread = {
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    const mockComments = [
      {
        id: 'comment-123',
        username: 'johndoe',
        date: '2021-08-08T07:22:33.555Z',
        content: 'sebuah comment',
        is_delete: false,
      },
      {
        id: 'comment-124',
        username: 'dicoding',
        date: '2021-08-08T07:26:21.338Z',
        content: 'comment yang dihapus',
        is_delete: true,
      },
    ];

    const mockRepliesForComment123 = [
      {
        id: 'reply-123',
        content: 'sebuah balasan',
        date: '2021-08-08T08:07:01.522Z',
        username: 'dicoding',
        is_delete: false,
      },
      {
        id: 'reply-124',
        content: 'balasan yang dihapus',
        date: '2021-08-08T08:10:01.522Z',
        username: 'johndoe',
        is_delete: true,
      },
    ];

    const mockRepliesForComment124 = [
      {
        id: 'reply-125',
        content: 'balasan lain yang dihapus',
        date: '2021-08-08T08:15:01.522Z',
        username: 'dicoding',
        is_delete: true,
      },
    ];

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();
    const mockLikeRepository = new LikeRepository();

    mockThreadRepository.getThreadById = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockThread));
    mockCommentRepository.getCommentsByThreadId = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockComments));
    mockReplyRepository.getRepliesByCommentId = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(mockRepliesForComment123))
      .mockImplementationOnce(() => Promise.resolve(mockRepliesForComment124));
    mockLikeRepository.getLikeCountByCommentId = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(2))
      .mockImplementationOnce(() => Promise.resolve(1));

    const getThreadUseCase = new GetThreadUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
      likeRepository: mockLikeRepository,
    });

    // Action
    const result = await getThreadUseCase.execute(threadId);

    // Assert
    expect(result).toStrictEqual({
      thread: {
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comments: [
          {
            id: 'comment-123',
            username: 'johndoe',
            date: '2021-08-08T07:22:33.555Z',
            content: 'sebuah comment',
            is_delete: false,
            likeCount: 2,
            replies: [
              {
                id: 'reply-123',
                content: 'sebuah balasan',
                date: '2021-08-08T08:07:01.522Z',
                username: 'dicoding',
                is_delete: false,
              },
              {
                id: 'reply-124',
                content: '**balasan telah dihapus**',
                date: '2021-08-08T08:10:01.522Z',
                username: 'johndoe',
                is_delete: true,
              },
            ],
          },
          {
            id: 'comment-124',
            username: 'dicoding',
            date: '2021-08-08T07:26:21.338Z',
            content: '**komentar telah dihapus**',
            is_delete: true,
            likeCount: 1,
            replies: [
              {
                id: 'reply-125',
                content: '**balasan telah dihapus**',
                date: '2021-08-08T08:15:01.522Z',
                username: 'dicoding',
                is_delete: true,
              },
            ],
          },
        ],
      },
    });

    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(
      threadId,
    );
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith(
      'comment-123',
    );
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith(
      'comment-124',
    );
    expect(mockLikeRepository.getLikeCountByCommentId).toBeCalledWith(
      'comment-123',
    );
    expect(mockLikeRepository.getLikeCountByCommentId).toBeCalledWith(
      'comment-124',
    );
  });

  it('should orchestrating the get thread action correctly when thread has no comments', async () => {
    // Arrange
    const threadId = 'thread-123';
    const mockThread = {
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    const mockComments = [];

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();
    const mockLikeRepository = new LikeRepository();

    mockThreadRepository.getThreadById = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockThread));
    mockCommentRepository.getCommentsByThreadId = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockComments));
    mockReplyRepository.getRepliesByCommentId = jest.fn();
    mockLikeRepository.getLikeCountByCommentId = jest.fn();

    const getThreadUseCase = new GetThreadUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
      likeRepository: mockLikeRepository,
    });

    // Action
    const result = await getThreadUseCase.execute(threadId);

    // Assert
    expect(result).toStrictEqual({
      thread: {
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comments: [],
      },
    });

    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(
      threadId,
    );
    expect(mockReplyRepository.getRepliesByCommentId).not.toBeCalled();
    expect(mockLikeRepository.getLikeCountByCommentId).not.toBeCalled();
  });
});
