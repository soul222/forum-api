const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const CommentLikesTableTestHelper = require('../../../../tests/CommentLikesTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

describe('Forum API Functional Tests', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  describe('Complete thread with comments, replies, and likes workflow', () => {
    it('should handle complete forum workflow correctly', async () => {
      const server = await createServer(container);

      // 1. Register users
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'dicoding',
          password: 'secret',
          fullname: 'Dicoding Indonesia',
        },
      });

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'johndoe',
          password: 'secret',
          fullname: 'John Doe',
        },
      });

      // 2. Login users
      const loginResponse1 = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });

      const loginResponse2 = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'johndoe',
          password: 'secret',
        },
      });

      const { data: { accessToken: accessToken1 } } = JSON.parse(loginResponse1.payload);
      const { data: { accessToken: accessToken2 } } = JSON.parse(loginResponse2.payload);

      // 3. Create thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'sebuah thread',
          body: 'sebuah body thread',
        },
        headers: {
          Authorization: `Bearer ${accessToken1}`,
        },
      });

      const { data: { addedThread } } = JSON.parse(threadResponse.payload);

      // 4. Add comments
      const commentResponse1 = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: {
          content: 'sebuah comment pertama',
        },
        headers: {
          Authorization: `Bearer ${accessToken1}`,
        },
      });

      const commentResponse2 = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: {
          content: 'sebuah comment kedua',
        },
        headers: {
          Authorization: `Bearer ${accessToken2}`,
        },
      });

      const { data: { addedComment: addedComment1 } } = JSON.parse(commentResponse1.payload);
      const { data: { addedComment: addedComment2 } } = JSON.parse(commentResponse2.payload);

      // 5. Add replies
      await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments/${addedComment1.id}/replies`,
        payload: {
          content: 'sebuah balasan',
        },
        headers: {
          Authorization: `Bearer ${accessToken2}`,
        },
      });

      // 6. Like comments
      await server.inject({
        method: 'PUT',
        url: `/threads/${addedThread.id}/comments/${addedComment1.id}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken1}`,
        },
      });

      await server.inject({
        method: 'PUT',
        url: `/threads/${addedThread.id}/comments/${addedComment1.id}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken2}`,
        },
      });

      await server.inject({
        method: 'PUT',
        url: `/threads/${addedThread.id}/comments/${addedComment2.id}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken1}`,
        },
      });

      // 7. Get thread detail with all data
      const threadDetailResponse = await server.inject({
        method: 'GET',
        url: `/threads/${addedThread.id}`,
      });

      const threadDetailJson = JSON.parse(threadDetailResponse.payload);

      // 8. Verify complete response structure
      expect(threadDetailResponse.statusCode).toEqual(200);
      expect(threadDetailJson.status).toEqual('success');
      expect(threadDetailJson.data.thread).toBeDefined();
      expect(threadDetailJson.data.thread.comments).toHaveLength(2);
      expect(threadDetailJson.data.thread.comments[0].likeCount).toEqual(2);
      expect(threadDetailJson.data.thread.comments[1].likeCount).toEqual(1);
      expect(threadDetailJson.data.thread.comments[0].replies).toHaveLength(1);

      // 9. Delete comment and verify soft delete
      await server.inject({
        method: 'DELETE',
        url: `/threads/${addedThread.id}/comments/${addedComment2.id}`,
        headers: {
          Authorization: `Bearer ${accessToken2}`,
        },
      });

      // 10. Verify deleted comment shows as deleted
      const threadAfterDeleteResponse = await server.inject({
        method: 'GET',
        url: `/threads/${addedThread.id}`,
      });

      const threadAfterDeleteJson = JSON.parse(threadAfterDeleteResponse.payload);
      expect(threadAfterDeleteJson.data.thread.comments[1].content).toEqual('**komentar telah dihapus**');
      expect(threadAfterDeleteJson.data.thread.comments[1].likeCount).toEqual(1);
    });
  });
});
