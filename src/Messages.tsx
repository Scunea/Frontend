import React, { useState, useEffect } from 'react';
import { Stack, PrimaryButton, SearchBox, DatePicker, IconButton, Text, FontIcon, DayOfWeek, Modal, MessageBar, MessageBarType } from '@fluentui/react';
import { NeutralColors } from '@fluentui/theme';
import FuzzySet from 'fuzzyset';
import InfiniteScroll from 'react-infinite-scroll-component';
import ReadMessage from './ReadMessage';
import NewMessage from './NewMessage';
import { Message, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const Messages = (props: { domain: string | undefined; info: User; ws: WebSocket | undefined; }) => {

    const [messages, setMessages] = useState<Message[]>([]);
    const [messagesLoaded, setMessagesLoaded] = useState<Message[]>([]);
    const [searchFound, setSearchFound] = useState<Message[] | boolean>(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [newMessage, setNewMessage] = useState(false);
    const [titlesFuzzySet, setTitlesFuzzySet] = useState(FuzzySet());
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [error, setError] = useState('');

    useEffect(() => {
        if (localStorage.getItem("token") && localStorage.getItem("school")) {
            fetch(props.domain + '/messages', {
                headers: new Headers({
                    'Authorization': localStorage.getItem('token') ?? "",
                    'School': localStorage.getItem('school') ?? ""
                })
            })
                .then(res => res.json()).then(json => {
                    if (!json?.error) {
                        const messages = (json as Array<Message>).sort((a, b) => b.date - a.date);
                        setMessages(messages);
                        messages.forEach(message => {
                            setTitlesFuzzySet(titlesFuzzySet => {
                                titlesFuzzySet.add(message.title);
                                return titlesFuzzySet;
                            });
                        });
                        setMessagesLoaded(messages.slice(0, 20));
                    } else {
                        setError(json.error);
                    }
                });
        }

        if (props.ws) {
            props.ws.addEventListener('message', (message: MessageEvent) => {
                    const data = JSON.parse(message.data);
                    if (data.event === 'newMessage') {
                        setMessages(messages => {
                            let newMessages = [data, ...messages];
                            setMessagesLoaded(newMessages.slice(0, 20));
                            return newMessages;
                        });
                        setTitlesFuzzySet(titlesFuzzySet => {
                            titlesFuzzySet.add(data.title);
                            return titlesFuzzySet;
                        });
                    } else if (data.event === 'editedMessage') {
                        setMessages(messages => {
                            let newMessages = [...messages];
                            newMessages[newMessages.findIndex(x => x.id === data.id)].title = data.message.title;
                            newMessages[newMessages.findIndex(x => x.id === data.id)].content = data.message.content;
                            newMessages[newMessages.findIndex(x => x.id === data.id)].files = data.message.files;
                            newMessages[newMessages.findIndex(x => x.id === data.id)].receiver = data.message.receiver;

                            setMessagesLoaded(newMessages.slice(0, 20));
                            return newMessages;
                        });
                        setTitlesFuzzySet(titlesFuzzySet => {
                            titlesFuzzySet.add(data.message.title);
                            return titlesFuzzySet;
                        });
                    } else if (data.event === 'deletedMessage') {
                        setMessages(messages => {
                            let newMessages = [...messages];
                            newMessages.splice(newMessages.findIndex(x => x.id === data.id), 1);
                            setMessagesLoaded(newMessages.slice(0, 20));
                            return newMessages;
                        });
                }
            });
        }
    }, []);

    useEffect(() => {
        if (date) {
            let messagesLoadedPre: Message[] = [];
            messages.forEach(message => {
                const messageDate = new Date(message.date);
                if (messageDate.getDate() === date.getDate() && messageDate.getMonth() === date.getMonth() && messageDate.getFullYear() === date.getFullYear()) {
                    messagesLoadedPre.push(message);
                    if (Array.isArray(searchFound) && !searchFound.includes(message)) {
                        messagesLoadedPre.pop();
                    }
                }
            });
            setMessagesLoaded(messagesLoadedPre);
        } else if (typeof searchFound === 'object') {
            setMessagesLoaded(messages.filter(x => searchFound.includes(x)))
        } else {
            setMessagesLoaded(messages.slice(0, 20));
        }
    }, [date, searchFound]);

    const { t } = useTranslation();

    return (
        <Stack styles={{
            root: {
                margin: 25,
            }
        }}>
            {selectedMessage ? <Modal isOpen styles={{
                main: {
                    width: 'calc(100% - 25px)',
                    height: 'calc(100% - 25px)'
                },
                scrollableContent: {
                    overflowY: 'none'
                }
            }}>
                <ReadMessage domain={props.domain} messages={messages} selectedMessage={selectedMessage} setSelectedMessage={setSelectedMessage} info={props.info}></ReadMessage>
            </Modal> : null}
            {newMessage ? <Modal isOpen styles={{
                main: {
                    width: 'calc(100% - 25px)',
                    height: 'calc(100% - 25px)'
                },
                scrollableContent: {
                    overflowY: 'none'
                }
            }}>
                <NewMessage domain={props.domain} info={props.info} newMessage={newMessage} setNewMessage={setNewMessage}></NewMessage>
            </Modal> : null}
            <Stack horizontal styles={{
                root: {
                    justifyContent: 'space-between'
                }
            }}>
                <Stack.Item>
                    <PrimaryButton text={t('New message')} iconProps={{ iconName: 'Send' }} onClick={() => setNewMessage(true)} />
                </Stack.Item>
                <Stack.Item styles={{
                    root: {
                        width: '50%'
                    }
                }}>
                    <SearchBox placeholder={t('Search')} underlined onChange={event => {
                        if (event?.target.value) {
                            const found = titlesFuzzySet.get(event?.target.value ?? "", null, .1)?.map(x => x[1]);
                            let messagesLoadedPre: Message[] = [];
                            messages.forEach(message => {
                                if (found?.includes(message.title)) {
                                    messagesLoadedPre.push(message);
                                }
                            });
                            setSearchFound(messagesLoadedPre);
                        } else {
                            setSearchFound(false);
                        }
                    }} />
                </Stack.Item>
                <Stack.Item styles={{
                    root: {
                        display: 'inline-flex'
                    }
                }}>
                    <DatePicker firstDayOfWeek={DayOfWeek.Sunday} placeholder={t('Select date...')} value={date} onSelectDate={date => date !== null && setDate(date)} />

                    <IconButton iconProps={{
                        iconName: 'ChromeClose'
                    }} onClick={() => setDate(undefined)} />
                </Stack.Item>
            </Stack>
            <Stack styles={{
                root: {
                    marginBottom: 25
                }
            }}>
                <Stack.Item>
                    {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')} >
                        {t(error)}
                    </MessageBar> : null}
                </Stack.Item>
            </Stack>
            <Stack>
                {messagesLoaded.length > 0 ? <InfiniteScroll
                    dataLength={messagesLoaded.length}
                    next={() => {
                        setMessagesLoaded(messages.slice(0, messagesLoaded.length + 19));
                    }}
                    hasMore={messagesLoaded.length !== messages.length}
                    loader={<Text styles={{
                        root: {
                            marginBottom: 25
                        }
                    }}>Loading...</Text>}>
                    {messagesLoaded.map(message => (
                        <Stack.Item key={message.id} styles={{
                            root: {
                                cursor: 'pointer',
                                marginBottom: 25,
                                border: '1px solid black',
                                boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)'
                            }
                        }} onClick={() => {
                            setSelectedMessage(message);
                        }}>
                            <Stack styles={{
                                root: {
                                    height: 200,
                                    width: '100%',
                                    background: NeutralColors.white,
                                    justifyContent: 'center',
                                    paddingLeft: 25,
                                    paddingRight: 25
                                }
                            }}>
                                <Stack.Item>
                                    <Text styles={message.files.length > 0 ? {
                                        root: {
                                            position: 'absolute'
                                        }
                                    } : {}}>{message.receiver ? t('From somebody to somebody', { from: message.author.name, to: message.receiver.map(x => x.name).join(', ') }) : t('From somebody', { from: message.author.name })}</Text>
                                </Stack.Item>
                                {message.files.length > 0 ? <Stack.Item styles={{
                                    root: {
                                        alignSelf: 'flex-end'
                                    }
                                }}>
                                    <FontIcon iconName="Attach" />
                                </Stack.Item> : null}
                                <Stack.Item>
                                    <Text variant="smallPlus" styles={{
                                        root: {
                                            color: NeutralColors.gray130
                                        }
                                    }}>{new Date(message.date).toString()}</Text>
                                </Stack.Item>
                                <Stack.Item styles={{
                                    root: {
                                        marginBottom: 5
                                    }
                                }}>
                                    <Text variant="large">{message.title}</Text>
                                </Stack.Item>
                                <Stack.Item styles={{
                                    root: {
                                        height: 100
                                    }
                                }}>
                                    <Text variant="smallPlus" styles={{
                                        root: {
                                            color: NeutralColors.gray130,
                                            display: 'inline-block',
                                            overflow: 'hidden',
                                            overflowWrap: 'anywhere',
                                            textOverflow: 'ellipsis',
                                            height: '100%'
                                        }
                                    }}>
                                        {message.preview ?? t('Preview not available.')}
                                    </Text>
                                </Stack.Item>
                            </Stack>
                        </Stack.Item>
                    ))}
                </InfiniteScroll> : <Text styles={{
                    root: {
                        marginBottom: 25
                    }
                }}>{t('No messages!')}</Text>}
            </Stack>
        </Stack>
    );
};

export default Messages;