import React, { useEffect, useState } from 'react';
import { DefaultButton, IconButton, MessageBar, MessageBarType, Persona, PrimaryButton, Stack, Text } from '@fluentui/react';
import { DataSheetGrid, keyColumn, textColumn } from 'react-datasheet-grid';
import { Grade, User, SimpleUser } from './interfaces';
import 'react-datasheet-grid/dist/style.css';
import { useTranslation } from 'react-i18next';

const Grades = (props: { domain: string | undefined; info: User; ws: WebSocket | undefined; }) => {

    const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);
    const [originalData, setOriginalData] = useState<Grade[]>([]);
    const [data, setData] = useState<Grade[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (localStorage.getItem("token") && localStorage.getItem("schoolId")) {
            if (props.info?.teacher) {
                fetch(props.domain + '/grades', {
                    headers: new Headers({
                        'Authorization': localStorage.getItem('token') ?? "",
                        'School': localStorage.getItem('schoolId') ?? ""
                    })
                })
                    .then(res => res.json()).then(json => {
                        if (!json?.error) {
                            setOriginalData(json);
                            setData(json);
                        } else {
                            setError(json.error);
                        }
                    });
            }
        }

        if (props.ws) {
            props.ws.onmessage = (message: MessageEvent) => {
                const data = JSON.parse(message.data);
                if (data.event === 'newGrades') {
                    setData(data.grades);
                }
            }
        }

    }, []);

    useEffect(() => {
        if (localStorage.getItem("token") && localStorage.getItem("schoolId")) {
            if (props.info?.administrator && selectedUser) {
                fetch(props.domain + '/grades/' + selectedUser.id, {
                    headers: new Headers({
                        'Authorization': localStorage.getItem('token') ?? "",
                        'School': localStorage.getItem('schoolId') ?? ""
                    })
                })
                    .then(res => res.json()).then(json => {
                        if (!json?.error) {
                            setData(json);
                        } else {
                            setError(json.error);
                        }
                    });
            }
        }
    }, [selectedUser]);

    const { t } = useTranslation();

    return (
        props.info.teacher ? <Stack styles={{
            root: {
                padding: 25
            }
        }}>
            <Text variant="xxLarge">{t('Something grades', { something: props.info?.teacher })}</Text>
            <Stack.Item styles={{
                root: {
                    marginTop: '25px !important'
                }
            }}>
                {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')}>
                    {t(error)}
                </MessageBar> : <div></div>}
            </Stack.Item>
            <DataSheetGrid
                className="grades-sheet"
                value={data}
                addRowsComponent={() => {
                    return <></>;
                }}
                contextMenuComponent={(props) => {
                    props.close();
                    return <></>;
                }}
                onChange={(value) => setData(value as Grade[])}
                columns={[
                    {
                        ...keyColumn('id', textColumn),
                        disabled: true,
                        title: t('ID'),
                    },
                    {
                        ...keyColumn('fullName', textColumn),
                        disabled: true,
                        title: t('Full name'),
                    },
                    {
                        ...keyColumn('deliberation', textColumn),
                        title: t('Deliberation'),
                    },
                    {
                        ...keyColumn('conceptual', textColumn),
                        title: t('Conceptual'),
                    },
                    {
                        ...keyColumn('averageFirstFour', textColumn),
                        title: t('Average of the first four months'),
                    },
                    {
                        ...keyColumn('averageSecondFour', textColumn),
                        title: t('Average of the second four months'),
                    },
                    {
                        ...keyColumn('final', textColumn),
                        title: t('Final grade'),
                    }
                ]}
            />
            <Stack.Item>
                <PrimaryButton text={t('Save')} iconProps={{ iconName: 'Save' }} disabled={JSON.stringify(data) === JSON.stringify(originalData)} onClick={() => {
                    fetch(props.domain + '/grades', {
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: new Headers({
                            'Authorization': localStorage.getItem('token') ?? "",
                            'School': localStorage.getItem('schoolId') ?? "",
                            'Content-Type': 'application/json'
                        })
                    }).then(res => res.json()).then(json => {
                        if (!json?.error) {
                            setOriginalData(data);
                        } else {
                            setError(json.error);
                        }
                    });
                }} />
            </Stack.Item>
        </Stack> : props.info?.administrator ? selectedUser ? <Stack styles={{
            root: {
                padding: 25
            }
        }}>
            <Stack.Item>
                <IconButton iconProps={{ iconName: 'Back' }} onClick={() => {
                    setSelectedUser(null);
                }}></IconButton>
            </Stack.Item>
            <Text variant="xxLarge">{t('Somebody\'s grades', { user: selectedUser.name })}</Text>
            <Stack.Item styles={{
                root: {
                    marginTop: '25px !important'
                }
            }}>
                {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')}>
                    {t(error)}
                </MessageBar> : <div></div>}
            </Stack.Item>
            <DataSheetGrid
                className="grades-sheet"
                value={data}
                addRowsComponent={() => {
                    return <></>;
                }}
                contextMenuComponent={(props) => {
                    props.close();
                    return <></>;
                }}
                columns={[
                    {
                        ...keyColumn('subject', textColumn),
                        disabled: true,
                        title: t('Subject'),
                    },
                    {
                        ...keyColumn('deliberation', textColumn),
                        disabled: true,
                        title: t('Deliberation'),
                    },
                    {
                        ...keyColumn('conceptual', textColumn),
                        disabled: true,
                        title: t('Conceptual'),
                    },
                    {
                        ...keyColumn('averageFirstFour', textColumn),
                        disabled: true,
                        title: t('Average of the first four months'),
                    },
                    {
                        ...keyColumn('averageSecondFour', textColumn),
                        disabled: true,
                        title: t('Average of the second four months'),
                    },
                    {
                        ...keyColumn('final', textColumn),
                        disabled: true,
                        title: t('Final grade'),
                    }
                ]}
            />
        </Stack> : <Stack styles={{
            root: {
                padding: 25
            }
        }}>
            <Stack.Item styles={{
                root: {
                    marginBottom: 15
                }
            }}>
                <Text variant="xxLarge">{t('Choose a student')}</Text>
                {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')}>
                    {t(error)}
                </MessageBar> : null}
            </Stack.Item>
            {props.info?.avaliable.filter(x => x.type === 'Student').length < 1 ? <Text>{t('No students!')}</Text> : null}
            {props.info?.avaliable.filter(x => x.type === 'Student').sort((a, b) => a.name.localeCompare(b.name)).map((x, i) => <DefaultButton key={i} styles={{
                root: {
                    display: 'flex',
                    minHeight: 75,
                    marginTop: '10px !important'
                }
            }} onClick={() => {
                setSelectedUser(x);
            }}>
                <Persona {...{
                    text: x.name
                }}></Persona>
            </DefaultButton>)}
        </Stack> : !props.info?.child ? <Stack styles={{
            root: {
                padding: 25
            }
        }}>
            <Text variant="xxLarge">{t('Your grades')}</Text>
            <Stack.Item styles={{
                root: {
                    marginTop: '25px !important'
                }
            }}>
                {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')}>
                    {t(error)}
                </MessageBar> : <div></div>}
            </Stack.Item>
            <DataSheetGrid
                className="grades-sheet"
                value={props.info?.grades}
                addRowsComponent={() => {
                    return <></>;
                }}
                contextMenuComponent={(props) => {
                    props.close();
                    return <></>;
                }}
                columns={[
                    {
                        ...keyColumn('subject', textColumn),
                        disabled: true,
                        title: t('Subject'),
                    },
                    {
                        ...keyColumn('deliberation', textColumn),
                        disabled: true,
                        title: t('Deliberation'),
                    },
                    {
                        ...keyColumn('conceptual', textColumn),
                        disabled: true,
                        title: t('Conceptual'),
                    },
                    {
                        ...keyColumn('averageFirstFour', textColumn),
                        disabled: true,
                        title: t('Average of the first four months'),
                    },
                    {
                        ...keyColumn('averageSecondFour', textColumn),
                        disabled: true,
                        title: t('Average of the second four months'),
                    },
                    {
                        ...keyColumn('final', textColumn),
                        disabled: true,
                        title: t('Final grade'),
                    }
                ]}
            />
        </Stack> : <Stack styles={{
            root: {
                padding: 25
            }
        }}>
            <Text variant="xxLarge">{t('Your child\'s grades')}</Text>
            <Stack.Item styles={{
                root: {
                    marginTop: '25px !important'
                }
            }}>
                {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')}>
                    {t(error)}
                </MessageBar> : <div></div>}
            </Stack.Item>
            <DataSheetGrid
                className="grades-sheet"
                value={props.info?.grades}
                addRowsComponent={() => {
                    return <></>;
                }}
                contextMenuComponent={(props) => {
                    props.close();
                    return <></>;
                }}
                columns={[
                    {
                        ...keyColumn('id', textColumn),
                        disabled: true,
                        title: t('ID'),
                    },
                    {
                        ...keyColumn('fullName', textColumn),
                        disabled: true,
                        title: t('Full name'),
                    },
                    {
                        ...keyColumn('deliberation', textColumn),
                        disabled: true,
                        title: t('Deliberation'),
                    },
                    {
                        ...keyColumn('conceptual', textColumn),
                        disabled: true,
                        title: t('Conceptual'),
                    },
                    {
                        ...keyColumn('averageFirstFour', textColumn),
                        disabled: true,
                        title: t('Average of the first four months'),
                    },
                    {
                        ...keyColumn('averageSecondFour', textColumn),
                        disabled: true,
                        title: t('Average of the second four months'),
                    },
                    {
                        ...keyColumn('final', textColumn),
                        disabled: true,
                        title: t('Final grade'),
                    }
                ]}
            />
        </Stack>
    );
};

export default Grades;