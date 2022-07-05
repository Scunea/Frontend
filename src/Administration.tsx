import React, { useEffect, useMemo, useState } from 'react';
import { CommandBar, DefaultButton, DetailsList, getTheme, Modal, PrimaryButton, Stack, Text, TextField, IObjectWithKey, Selection, SelectionMode, IDialogProps, IDialogFooterProps, Dialog as DialogMS, DialogFooter as DialogFooterMS, DialogType, Dropdown, SearchBox, MessageBar, MessageBarType } from '@fluentui/react';
import { useBoolean } from '@fluentui/react-hooks';
import FuzzySet from 'fuzzyset';
import { Person, PersonSelect, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const Administration = (props: { domain: string | undefined; info: User; ws: WebSocket | undefined; }) => {

    const Dialog = (props: IDialogProps & { children: any }) => {
        return <DialogMS {...props}></DialogMS>;
    };

    const DialogFooter = (props: IDialogFooterProps & { children: any }) => {
        return <DialogFooterMS {...props}></DialogFooterMS>;
    };

    const selectionConst = useMemo(() => new Selection({
        onSelectionChanged: () => {
            setSelection(selectionConst.getSelection())
        }
    }), []);

    const [addUserDialogIsOpen, { toggle: toggleAddUserDialogIsOpen }] = useBoolean(false);
    const [hideDeleteDialog, { toggle: toggleHideDeleteDialog }] = useBoolean(true);
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [type, setType] = useState('');
    const [people, setPeople] = useState<Person[]>([]);
    const [selection, setSelection] = useState<IObjectWithKey[]>([]);
    const [searchFound, setSearchFound] = useState<Person[] | boolean>(false);
    const [namesFuzzySet, setNamesFuzzySet] = useState(FuzzySet());
    const [error, setError] = useState('');

    useEffect(() => {
        if (localStorage.getItem("token") && localStorage.getItem("schoolId")) {
            fetch(props.domain + '/people', {
                headers: new Headers({
                    'Authorization': localStorage.getItem('token') ?? "",
                    'School': localStorage.getItem('schoolId') ?? ""
                })
            })
                .then(res => res.json()).then(json => {
                    if (!json?.error) {
                        const people = (json as Person[]).sort((a, b) => a.name.localeCompare(b.name));
                        setPeople(people);
                        people.forEach(person => {
                            setNamesFuzzySet(namesFuzzySet => {
                                namesFuzzySet.add(person.name);
                                return namesFuzzySet;
                            });
                        });
                    }
                });
        }

        if (props.ws) {
            props.ws.onmessage = (message: MessageEvent) => {
                const data = JSON.parse(message.data);
                if (data.event === 'newUser') {
                    setPeople(people => {
                        let newPeople = [...people];
                        newPeople.push({
                            id: data.user.id,
                            name: data.user.name,
                            email: data.user.email,
                            number: data.user.number,
                            subject: data.user.subject,
                            child: data.user.child,
                            type: data.user.type.split('').map((x: string, i: number) => i === 0 ? x.toUpperCase() : x).join('')
                        });
                        newPeople = newPeople.sort((a, b) => a.name.localeCompare(b.name));
                        setNamesFuzzySet(namesFuzzySet => {
                            namesFuzzySet.add(data.user.name);
                            return namesFuzzySet;
                        });
                        return newPeople;
                    });
                } else if (data.event === 'editedUser') {
                    setPeople(people => {
                        let newPeople = [...people];
                        const index = newPeople.findIndex(x => x.id === data.user.id);
                        newPeople[index].name = data.user.name;
                        newPeople[index].subject = data.user.subject;
                        newPeople = newPeople.sort((a, b) => a.name.localeCompare(b.name));
                        setNamesFuzzySet(namesFuzzySet => {
                            namesFuzzySet.add(data.user.name);
                            return namesFuzzySet;
                        });
                        return newPeople;
                    });
                } else if (data.event === 'deletedUser') {
                    setPeople(people => {
                        let newPeople = [...people];
                        const index = newPeople.findIndex(x => x.id === data.userId);
                        const name = newPeople[index];
                        if (index > -1) {
                            newPeople.splice(index, 1);
                        }
                        newPeople = newPeople.sort((a, b) => a.name.localeCompare(b.name));
                        return newPeople;
                    });
                }
            }
        }
    }, []);

    const { t } = useTranslation();

    return (
        props.info?.administrator ? <Stack styles={{
            root: {
                padding: 25
            }
        }}>
            <Stack.Item>
                <CommandBar
                    items={[
                        {
                            key: 'add',
                            text: t('Invite'),
                            iconProps: { iconName: 'Add' },
                            onClick: () => {
                                toggleAddUserDialogIsOpen();
                            }
                        },
                        {
                            key: 'delete',
                            text: t('Delete'),
                            iconProps: { iconName: 'Trash' },
                            disabled: selection.length < 1,
                            onClick: () => {
                                toggleHideDeleteDialog();
                            }
                        }
                    ]} farItems={[
                        {
                            key: 'search',
                            onRender: () => <SearchBox placeholder={t('Search')} underlined onChange={event => {
                                if (event?.target.value) {
                                    const found = namesFuzzySet.get(event?.target.value ?? "", null, .1)?.map(x => x[1]);
                                    let peopleLoadedPre: Person[] = [];
                                    people.forEach(person => {
                                        if (found?.includes(person.name)) {
                                            peopleLoadedPre.push(person);
                                        }
                                    });
                                    setSearchFound(peopleLoadedPre);
                                } else {
                                    setSearchFound(false);
                                }
                            }} />
                        }
                    ]}
                />
                <Modal isOpen={addUserDialogIsOpen} onDismiss={toggleAddUserDialogIsOpen}>
                    <Stack>
                        <div style={{
                            borderTop: `4px solid ${getTheme().palette.themePrimary}`
                        }}></div>
                        <Text variant={'xLarge'} styles={{
                            root: {
                                color: getTheme().palette.themePrimary,
                                padding: '16px 46px 20px 24px'
                            }
                        }}>{t('Invite user')}</Text>
                        <Stack.Item styles={{
                            root: {
                                padding: '0px 24px 24px'
                            }
                        }}>
                            <Stack tokens={{
                                childrenGap: 25
                            }}>
                                <Stack.Item>
                                    <TextField placeholder="Email" value={email} underlined onChange={(event, value) => setEmail(value ?? '')}></TextField>
                                </Stack.Item>
                                <Stack.Item>
                                    <Dropdown selectedKey={type ? type : undefined} onChange={(event, item) => setType(item?.key?.toString() ?? 'student')} options={[
                                        { key: 'student', text: t('Student') },
                                        { key: 'teacher', text: t('Teacher') },
                                        { key: 'administrator', text: t('Administrator') }
                                    ]} />
                                </Stack.Item>
                                <Stack.Item>
                                    {type === 'teacher' ? <TextField placeholder={t('Subject')} value={subject} underlined onChange={(event, value) => setSubject(value ?? '')}></TextField> : null}
                                </Stack.Item>
                            </Stack>
                            {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')} styles={{
                                root: {
                                    marginTop: 24
                                }
                            }}>
                                {t(error)}
                            </MessageBar> : null}
                            <div style={{
                                margin: '16px 0px 0px',
                                textAlign: 'right',
                                marginRight: '-4px'
                            }}>
                                <PrimaryButton disabled={!email || !type || ((type === 'teacher' && !subject))} styles={{
                                    root: {
                                        margin: '0 4px'
                                    }
                                }} onClick={() => {
                                    fetch(props.domain + '/people', {
                                        method: 'PUT',
                                        body: JSON.stringify({
                                            email: email,
                                            type: type,
                                            subject: subject
                                        }),
                                        headers: new Headers({
                                            'Authorization': localStorage.getItem('token') ?? "",
                                            'School': localStorage.getItem('schoolId') ?? "",
                                            'Content-Type': 'application/json'
                                        })
                                    }).then(res => res.json()).then(json => {
                                        if (!json?.error) {
                                            toggleAddUserDialogIsOpen();
                                            setEmail('');
                                            setType('');
                                            setSubject('');
                                            setSubject('');
                                        } else {
                                            setError(json.error);
                                        }
                                    });
                                }} text={t('Invite')} />
                                <DefaultButton onClick={toggleAddUserDialogIsOpen} text={t('Cancel')} styles={{
                                    root: {
                                        margin: '0 4px'
                                    }
                                }} />
                            </div>
                        </Stack.Item>
                    </Stack>
                </Modal>
                <Dialog hidden={hideDeleteDialog} onDismiss={toggleHideDeleteDialog} dialogContentProps={{
                    type: DialogType.largeHeader,
                    title: t('Delete users?'),
                    subText: t('Do you want to delete these users?'),
                }}>
                    {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')} >
                        {t(error)}
                    </MessageBar> : null}
                    <DialogFooter>
                        <PrimaryButton onClick={() => {
                            fetch(props.domain + '/people', {
                                method: 'DELETE',
                                body: JSON.stringify({
                                    tos: (selection as PersonSelect[]).map(x => people.find(y => y.email === x.Email)?.id)
                                }),
                                headers: new Headers({
                                    'Authorization': localStorage.getItem('token') ?? "",
                                    'School': localStorage.getItem('schoolId') ?? "",
                                    'Content-Type': 'application/json'
                                })
                            }).then(res => res.json()).then(json => {
                                if (!json?.error) {
                                    toggleHideDeleteDialog();
                                } else {
                                    setError(json.error);
                                }
                            });
                        }} text={t('Delete')} />
                        <DefaultButton onClick={toggleHideDeleteDialog} text={t('Cancel')} />
                    </DialogFooter>
                </Dialog>
            </Stack.Item>
            <Stack.Item>
                {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')} >
                    {t(error)}
                </MessageBar> : null}
            </Stack.Item>
            <Stack.Item>
                <DetailsList setKey='ID' selection={selectionConst} selectionMode={SelectionMode.multiple} selectionPreservedOnEmptyClick items={(typeof searchFound !== 'boolean' ? searchFound.map(x => {
                    return {
                        Name: x.name,
                        Email: x.email,
                        Number: x.number ?? 'N/A',
                        Subject: x.subject ?? 'N/A',
                        Child: x.type === 'Parent' ? x.child?.name : 'N/A',
                        Type: x.type
                    }
                }) : people.map(x => {
                    return {
                        Name: x.name,
                        Email: x.email,
                        Number: x.number ?? 'N/A',
                        Subject: x.subject ?? 'N/A',
                        Child: x.type === 'Parent' ? x.child?.name : 'N/A',
                        Type: x.type
                    }
                })).map(x => {
                    return Object.fromEntries(Object.entries(x).map(x => {
                        if (x[0] === 'Type') {
                            x[1] = t(x[1]);
                        }
                        x[0] = t(x[0]);
                        return x;
                    }));
                })}></DetailsList>
            </Stack.Item>
        </Stack> : <Stack horizontalAlign='center' styles={{
            root: {
                padding: 25,
                textAlign: 'center'
            }
        }}>
            <Stack.Item>
                <Text variant='xxLarge' styles={{
                    root: {
                        fontWeight: 'bold'
                    }
                }}>{t('Access denied.')}</Text>
            </Stack.Item>
            <Stack.Item>
                <Text variant='large'>{t('Your account is not authorized to view this page.')}</Text>
            </Stack.Item>
        </Stack>
    );
};

export default Administration;