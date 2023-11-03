const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const { error } = require('console');

// Replace 'YOUR_BOT_TOKEN' with your bot's API token
const token = '6746880271:AAFmuz6DseWBAysKewOXlqSfpbBQyOvd5vo';

const bot = new TelegramBot(token, { polling: true });



bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const message = 'Выберите раздел:';

    const keyboard = {
        reply_markup: {
            keyboard: [
                [{ text: 'Добавить Базу данных 📊' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    };

    bot.sendMessage(chatId, message, keyboard);
});

    bot.on(/Добавить таблицу в базу 📝/, (msg) => {
        const chatId = msg.chat.id;

        const keyboard = {
            reply_markup: {
                keyboard: [
                    [{ text: 'Добавить данные в таблицу 📝' }, { text: 'Выбор БД ⚙' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        };

        axios.post("http://localhost:5000/api/create-table", {
            tableName: 'test',
            columns: [
                {
                    name: 'id',
                    type: 'SERIAL PRIMARY KEY'
                },
                {
                    name: 'name',
                    type: 'VARCHAR(255)'
                },
                {
                    name: 'metrica',
                    type: 'VARCHAR(255)'
                },
            ]})
            .then((response) => {
                console.log(response.data)
                isTableCreated = true;
                bot.sendMessage(chatId, 'Таблица успешно создана', keyboard);
            })
            .catch((error) => {
                console.log(error);
                bot.sendMessage(chatId, 'Не удалось создать Таблицу. Повторите попытку снова');
            })
    })

    bot.onText(/Добавить Базу данных 📊/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'Введите название базы данных, пользователя и пароль через запятую (например, postgres, barsik, password):');

        const keyboard = {
            reply_markup: {
                keyboard: [
                    [{ text: 'Добавить таблицу в базу 📝' }, { text: 'Выбор БД ⚙' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        };

        bot.once('message', (msg) => {
            const input = msg.text.split(',').map(item => item.trim());
            if (input.length !== 3) {
                bot.sendMessage(chatId, 'Неверный формат ввода. Повторите попытку снова.');
                return;
            }

            databaseName = input[0];
            databaseUser = input[1];
            databasePassword = input[2];

            axios.post("http://localhost:5000/api/create-db", {
                databaseName,
                databaseUser,
                databasePassword
            })
            .then((response) => {
                console.log(response.data)
                isDBCreated = true;
                bot.sendMessage(chatId, 'База данных создана', keyboard);
            })
            .catch((error) => {
                console.log(error);
                bot.sendMessage(chatId, 'Не удалось создать БД. Повторите попытку снова');
            });
        });
    });

bot.on(/Добавить данные в таблицу 📝/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Введите название имя, метрику через запятую (например, Денис, МЕТРИКАВАН):');

    const keyboard = {
        reply_markup: {
            keyboard: [
                [{ text: 'Добавить Базу данных 📊' }, { text: 'Выбор БД ⚙' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    };

    bot.once('message', (msg) => {

        const input = msg.text.split(',').map(item => item.trim());
        if (input.length !== 2) {
            bot.sendMessage(chatId, 'Неверный формат ввода. Повторите попытку снова.');
            return;
        }

        axios.post("http://localhost:5000/api/create-rows", {
            columns: [
                {
                    name,
                },
                {
                    metric,
                },
            ]})
            .then((response) => {
                console.log(response.data)
                bot.sendMessage(chatId, 'Данные успешно добавлены!', keyboard);
            })
            .catch((error) => {
                console.log(error);
                bot.sendMessage(chatId, 'Не удалось добавить данные в таблицу. Повторите попытку снова');
            })
        });
})

bot.onText(/Выбор БД ⚙/, (msg) => {
    const chatId = msg.chat.id;
    try {
        const response = axios.get('http://localhost:5000/api/get-user-db')
        .then((response) => {
            console.log(response.data);
            const str = "/" + response.data.join("\n/");
            bot.sendMessage(chatId, str);
        })
        .then((error) => {
            console.log(error);
        });

        return response.data;
    } catch (error) {
        console.error('Нет доступных баз данных:', error);
        return [];
    }
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    switch (text) {
    case '/server_status':
        const response = axios.get('http://localhost:5000/api/server-status')
        .then((response) => {
            bot.sendMessage(chatId, response.data);
        })
        .then((error) => {
            console.log(error);
        });
    break;
    case '/disk_status':
        const res = axios.get('http://localhost:5000/api/disk-status')
        .then((res) => {
            bot.sendMessage(chatId, res.data);
        })
        .then((error) => {
            console.log(error);
        });
    break;
    case '/help':
        const r = axios.get('http://localhost:5000/api/?')
        .then((r) => {
            bot.sendMessage(chatId, "/" + r.data.join("\n/"));
        })
        .then((error) => {
            console.log(error);
        });
    break;
    case '/add_user':
        const resp= axios.get('http://localhost:5000/api/add-user')
        .then((resp) => {
            bot.sendMessage(chatId, resp.data);
        })
        .then((error) => {
            console.log(error);
        });
    break;
    default:
        if(!text.includes(" ") && !text.includes("/start")) {
            bot.sendMessage(chatId, `Вы успешно подключились к БД ${text.replace("/", "")}`)
        }
    }
});




bot.on('polling_error', (error) => {
    console.error(error);
});

bot.on('webhook_error', (error) => {
    console.error(error);
});
