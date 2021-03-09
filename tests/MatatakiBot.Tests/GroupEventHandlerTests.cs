using MatatakiBot.Middlewares;
using MatatakiBot.Services;
using NSubstitute;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Xunit;

namespace MatatakiBot.Tests
{
    public class GroupEventHandlerTests
    {
        [Fact]
        public async Task GroupCreated()
        {
            var groupService = Substitute.For<IGroupService>();
            var botClient = Substitute.For<ITelegramBotClient>();

            var groups = new SortedList<long, (string, long)>();
            var members = new List<(long, long)>();

            groupService.IsGroupExistsAsync(default)
                .ReturnsForAnyArgs(info => groups.ContainsKey(info.ArgAt<long>(0)));
            groupService.EnsureGroupAsync(default, default!, default)
                .ReturnsForAnyArgs(info =>
                {
                    groups[info.ArgAt<long>(0)] = (info.ArgAt<string>(1), info.ArgAt<long>(2));

                    return default;
                });
            groupService.EnsureMemberAsync(default, default)
                .ReturnsForAnyArgs(info =>
                {
                    members.Add((info.ArgAt<long>(0), info.ArgAt<long>(1)));

                    return default;
                });

            botClient.GetChatAdministratorsAsync(Arg.Is<ChatId>(r => r.Identifier == -1)).Returns(new[]
            {
                new ChatMember() { Status = ChatMemberStatus.Creator, User = new User() { Id = 1234 } },
            });

            var middleware = new GroupEventHandler(groupService, botClient);

            var response = middleware.HandleMessageAsync(new Message()
            {
                Chat = new Chat() { Id = -1, Type = ChatType.Group, Title = "Test Group" },
                From = new User() { Id = 1234 },
                GroupChatCreated = true,
            }, _ => AsyncEnumerable.Empty<MessageResponse>()).GetAsyncEnumerator();

            Assert.False(await response.MoveNextAsync());

            Assert.True(groups.TryGetValue(-1, out var group));

            var (title, creatorId) = group;
            Assert.Equal("Test Group", title);
            Assert.Equal(1234, creatorId);

            Assert.Contains((-1, 1234), members);
        }

        [Fact]
        public async Task GroupMigration()
        {
            var groupService = Substitute.For<IGroupService>();
            var botClient = Substitute.For<ITelegramBotClient>();

            var groups = new SortedList<long, (string, long)>()
            {
                [-1] = ("Test Group", 1234),
            };
            var members = new List<(long, long)>()
            {
                (-1, 1234),
                (-1, 5678),
            };

            groupService.IsGroupExistsAsync(default)
                .ReturnsForAnyArgs(info => groups.ContainsKey(info.ArgAt<long>(0)));
            groupService.EnsureGroupAsync(default, default!, default)
                .ReturnsForAnyArgs(info =>
                {
                    groups[info.ArgAt<long>(0)] = (info.ArgAt<string>(1), info.ArgAt<long>(2));

                    return default;
                });

            groupService.MigrateGroupAsync(default, default).ReturnsForAnyArgs(info =>
            {
                var migrated = members.Where(row => row.Item1 == info.ArgAt<long>(0)).Select(row => (info.ArgAt<long>(1), row.Item2)).ToArray();

                members.RemoveAll(row => row.Item1 == info.ArgAt<long>(0));
                members.AddRange(migrated);

                return default;
            });
            groupService.RemoveGroupAsync(default).ReturnsForAnyArgs(info =>
            {
                groups.Remove(info.ArgAt<long>(0));

                return default;
            });

            botClient.GetChatAdministratorsAsync(Arg.Is<ChatId>(r => r.Identifier == -1)).Returns(new[]
            {
                new ChatMember() { Status = ChatMemberStatus.Creator, User = new User() { Id = 1234 } },
            });
            botClient.GetChatAdministratorsAsync(Arg.Is<ChatId>(r => r.Identifier == -123456789)).Returns(new[]
            {
                new ChatMember() { Status = ChatMemberStatus.Creator, User = new User() { Id = 1234 } },
            });

            var middleware = new GroupEventHandler(groupService, botClient);

            var migratingResponse = middleware.HandleMessageAsync(new Message()
            {
                Chat = new Chat() { Id = -1, Type = ChatType.Group, Title = "Test Group" },
                From = new User() { Id = 1234 },
                MigrateToChatId = -123456789,
            }, _ => AsyncEnumerable.Empty<MessageResponse>()).GetAsyncEnumerator();

            Assert.False(await migratingResponse.MoveNextAsync());

            var migratedResponse = middleware.HandleMessageAsync(new Message()
            {
                Chat = new Chat() { Id = -123456789, Type = ChatType.Supergroup, Title = "Test Group" },
                From = new User() { Id = 1234 },
                MigrateFromChatId = -1,
            }, _ => AsyncEnumerable.Empty<MessageResponse>()).GetAsyncEnumerator();

            Assert.False(await migratedResponse.MoveNextAsync());

            Assert.False(groups.ContainsKey(-1));
            Assert.True(groups.TryGetValue(-123456789, out var group));

            var (title, creatorId) = group;
            Assert.Equal("Test Group", title);
            Assert.Equal(1234, creatorId);

            Assert.DoesNotContain((-1, 1234), members);
            Assert.DoesNotContain((-1, 5678), members);
            Assert.Contains((-123456789, 1234), members);
            Assert.Contains((-123456789, 5678), members);
        }
    }
}
