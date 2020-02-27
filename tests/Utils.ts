import Telegraf from "telegraf";
import { Container } from "inversify";
import { AxiosInstance } from "axios";

import { MessageHandlerContext } from "#/definitions";
import { MetadataKeys, Injections } from "#/constants";
import { MatatakiServiceStub } from "./stubs/services/MatatakiServiceStub";
import { I18nServiceImpl } from "#/services/impls/I18nServiceImpl";

const service = new I18nServiceImpl();

function createMockedAsyncFunction() {
    return jest.fn(() => Promise.resolve());
}

export function createMockedContext(): MessageHandlerContext {
    // @ts-ignore
    const result = new Telegraf.Context();

    Object.assign(result, {
        message: {
            chat: {
                id: 1234567890,
            },
        },
        telegram: {
            sendMessage: createMockedAsyncFunction(),
        },
        i18n: service.getDefaultContext("zh-hans"),
    });

    Reflect.defineMetadata(MetadataKeys.Context, {
        ctx: result,
        container: createContainer(),
    }, result);

    return result as MessageHandlerContext;
};

function createContainer() {
    const result = new Container({ skipBaseClassChecks: true });

    result.bind(Injections.MatatakiService).toDynamicValue(() => new MatatakiServiceStub()).inSingletonScope();

    return result;
}

type MockedResponseForRequest = {
    request: {
        url: string,
        data?: any,
    },
    response: {
        status: number,
        data?: any,
    },
}
type MockedAxiosConfig = {
    get?: Array<MockedResponseForRequest>,
    post?: Array<MockedResponseForRequest>,
    put?: Array<MockedResponseForRequest>,
    delete?: Array<MockedResponseForRequest>,
}

export function createMockedAxios(config: MockedAxiosConfig) {
    const axios = jest.genMockFromModule<jest.Mocked<AxiosInstance>>("axios");

    mockAxiosInstance(axios, "get", config.get);
    mockAxiosInstance(axios, "post", config.post);
    mockAxiosInstance(axios, "put", config.put);
    mockAxiosInstance(axios, "delete", config.delete);

    return axios;
}
function mockAxiosInstance(axios: jest.Mocked<AxiosInstance>, method: keyof MockedAxiosConfig, configs?: Array<MockedResponseForRequest>) {
    if (!configs) {
        return;
    }

    if (method === "get" || method === "delete") {
        axios[method].mockImplementation(url => {
            const item = configs.find(x => x.request.url === url);
            if (!item) {
                throw new Error();
            }

            const { status, data } = item.response;

            if (status >= 400) {
                return Promise.reject({
                    response: {
                        status,
                        data,
                    },
                });
            }

            return Promise.resolve({
                status,
                data,
            });
        });
        return;
    }

    axios[method].mockImplementation(url => {
        const item = configs.find(x => x.request.url === url);
        if (!item) {
            throw new Error();
        }

        const { status, data } = item.response;

        return Promise.resolve({
            status,
            data,
        });
    });
}
