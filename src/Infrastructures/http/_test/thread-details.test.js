const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

describe('/threads/{threadId} endpoint with comments and replies', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  describe('when GET /threads/{threadId}', () => {
    it('should response 200 and return thread detail with comments and replies', async () => {
      // Arrange
      const server = await createServer(container);

      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
      });
      await UsersTableTestHelper.addUser({
        id: 'user-456',
        username: 'johndoe',
      });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner: 'user-123',
        date: '2021-08-08T07:19:09.775Z',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'sebuah comment',
        owner: 'user-456',
        threadId: 'thread-123',
        date: '2021-08-08T07:22:33.555Z',
        isDelete: false,
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-456',
        content: 'comment yang dihapus',
        owner: 'user-123',
        threadId: 'thread-123',
        date: '2021-08-08T07:26:21.338Z',
        isDelete: true,
      });

      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        content: 'balasan yang dihapus',
        owner: 'user-456',
        commentId: 'comment-123',
        date: '2021-08-08T07:59:48.766Z',
        isDelete: true,
      });

      await RepliesTableTestHelper.addReply({
        id: 'reply-456',
        content: 'sebuah balasan',
        owner: 'user-123',
        commentId: 'comment-123',
        date: '2021-08-08T08:07:01.522Z',
        isDelete: false,
      });

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/threads/thread-123',
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.thread).toBeDefined();
      expect(responseJson.data.thread.id).toEqual('thread-123');
      expect(responseJson.data.thread.title).toEqual('sebuah thread');
      expect(responseJson.data.thread.body).toEqual('sebuah body thread');
      expect(responseJson.data.thread.username).toEqual('dicoding');
      expect(responseJson.data.thread.comments).toBeDefined();
      expect(responseJson.data.thread.comments).toHaveLength(2);

      expect(responseJson.data.thread.comments[0].id).toEqual('comment-123');
      expect(responseJson.data.thread.comments[0].username).toEqual('johndoe');
      expect(responseJson.data.thread.comments[0].content).toEqual(
        'sebuah comment',
      );
      expect(responseJson.data.thread.comments[0].replies).toBeDefined();
      expect(responseJson.data.thread.comments[0].replies).toHaveLength(2);

      expect(responseJson.data.thread.comments[0].replies[0].id).toEqual(
        'reply-123',
      );
      expect(responseJson.data.thread.comments[0].replies[0].content).toEqual(
        '**balasan telah dihapus**',
      );
      expect(responseJson.data.thread.comments[0].replies[0].username).toEqual(
        'johndoe',
      );

      expect(responseJson.data.thread.comments[0].replies[1].id).toEqual(
        'reply-456',
      );
      expect(responseJson.data.thread.comments[0].replies[1].content).toEqual(
        'sebuah balasan',
      );
      expect(responseJson.data.thread.comments[0].replies[1].username).toEqual(
        'dicoding',
      );

      expect(responseJson.data.thread.comments[1].id).toEqual('comment-456');
      expect(responseJson.data.thread.comments[1].username).toEqual('dicoding');
      expect(responseJson.data.thread.comments[1].content).toEqual(
        '**komentar telah dihapus**',
      );
    });
  });
});
