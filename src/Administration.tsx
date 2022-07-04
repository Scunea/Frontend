import React, { useEffect, useMemo, useState } from 'react';
import { CommandBar, DefaultButton, DetailsList, getTheme, Modal, PrimaryButton, Stack, Text, TextField, IObjectWithKey, Selection, SelectionMode, IDialogProps, IDialogFooterProps, Dialog as DialogMS, DialogFooter as DialogFooterMS, DialogType, Dropdown, SearchBox } from '@fluentui/react';
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

    const [editUser, { toggle: toggleEditUser }] = useBoolean(false);
    const [addStudentDialogIsOpen, { toggle: toggleAddStudentDialogIsOpen }] = useBoolean(false);
    const [addParentDialogIsOpen, { toggle: toggleAddParentDialogIsOpen }] = useBoolean(false);
    const [addTeacherDialogIsOpen, { toggle: toggleHideAddTeacherDialogIsOpen }] = useBoolean(false);
    const [addAdministratorDialogIsOpen, { toggle: aeHideAddAdministratorDialogIsOpen }] = useBoolean(false);
    const [hideDeleteDialog, { toggle: toggleHideDeleteDialog }] = useBoolean(true);
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [child, setChild] = useState('');
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [people, setPeople] = useState<Person[]>([]);
    const [selection, setSelection] = useState<IObjectWithKey[]>([]);
    const [searchFound, setSearchFound] = useState<Person[] | boolean>(false);
    const [namesFuzzySet, setNamesFuzzySet] = useState(FuzzySet());

    useEffect(() => {
        if (localStorage.getItem("token") && localStorage.getItem("schoolId")) {
            fetch(props.domain + '/people', {
                headers: new Headers({
                    'Authorization': localStorage.getItem('token') ?? "",
                    'School': localStorage.getItem('schoolId') ?? ""
                })
            })
                .then(res => res.json()).then(json => {
                    if (Array.isArray(json)) {
                        const people = json.sort((a, b) => a.name.localeCompare(b.name));
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
                            text: t('Add'),
                            iconProps: { iconName: 'Add' },
                            subMenuProps: {
                                items: [
                                    {
                                        key: 'student',
                                        text: t('Student'),
                                        iconProps: { iconName: 'Edit' },
                                        onClick: () => {
                                            toggleAddStudentDialogIsOpen();
                                        }
                                    },
                                    {
                                        key: 'parent',
                                        text: t('Parent'),
                                        iconProps: { iconName: 'Family' },
                                        onClick: () => {
                                            toggleAddParentDialogIsOpen();
                                        }
                                    },
                                    {
                                        key: 'teacher',
                                        text: t('Teacher'),
                                        iconProps: { iconName: 'People' },
                                        onClick: () => {
                                            toggleHideAddTeacherDialogIsOpen();
                                        }
                                    },
                                    {
                                        key: 'administrator',
                                        text: t('Administrator'),
                                        iconProps: { iconName: 'Admin' },
                                        onClick: () => {
                                            aeHideAddAdministratorDialogIsOpen();
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            key: 'edit',
                            text: t('Edit'),
                            iconProps: { iconName: 'Edit' },
                            disabled: selection.length !== 1,
                            onClick: () => {
                                setName(people.find(x => x.id === ((selection as PersonSelect[]).map(x => x.ID))[0])?.name ?? '');
                                setSubject(people.find(x => x.id === ((selection as PersonSelect[]).map(x => x.ID))[0])?.subject ?? '');
                                toggleEditUser();
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
                <Modal isOpen={editUser} onDismiss={toggleEditUser}>
                    <Stack>
                        <div style={{
                            borderTop: `4px solid ${getTheme().palette.themePrimary}`
                        }}></div>
                        <Text variant={'xLarge'} styles={{
                            root: {
                                color: getTheme().palette.themePrimary,
                                padding: '16px 46px 20px 24px'
                            }
                        }}>{t('Edit somebody\'s profile', { user: people.find(x => x.id === ((selection as PersonSelect[]).map(x => x.ID))[0])?.name })}</Text>
                        <Stack.Item styles={{
                            root: {
                                padding: '0px 24px 24px'
                            }
                        }}>
                            <Stack tokens={{
                                childrenGap: 25
                            }}>
                                <Stack.Item>
                                    <TextField placeholder={t('Name')} value={name} underlined onChange={(event, value) => setName(value ?? '')}></TextField>
                                </Stack.Item>
                                {people.find(x => x.id === ((selection as PersonSelect[]).map(x => x.ID))[0])?.type === 'Teacher' ? <Stack.Item>
                                    <TextField placeholder={t('Subject')} value={subject} underlined onChange={(event, value) => setSubject(value ?? '')}></TextField>
                                </Stack.Item> : null}
                                <Stack.Item>
                                    <TextField type="password" placeholder={t('New password')} value={password} underlined onChange={(event, value) => setPassword(value ?? '')}></TextField>
                                </Stack.Item>
                            </Stack>
                            <div style={{
                                margin: '16px 0px 0px',
                                textAlign: 'right',
                                marginRight: '-4px'
                            }}>
                                <PrimaryButton disabled={!name && !password} styles={{
                                    root: {
                                        margin: '0 4px'
                                    }
                                }} onClick={() => {
                                    toggleEditUser();
                                    setName('');
                                    setPassword('');
                                    fetch(props.domain + '/people/' + ((selection as PersonSelect[]).map(x => x.ID))[0], {
                                        method: 'PATCH',
                                        body: JSON.stringify({
                                            name: name,
                                            subject: subject,
                                            password: password
                                        }),
                                        headers: new Headers({
                                            'Authorization': localStorage.getItem('token') ?? "",
                                            'School': localStorage.getItem('schoolId') ?? "",
                                            'Content-Type': 'application/json'
                                        })
                                    });
                                }} text={t('Save')} />
                                <DefaultButton onClick={toggleEditUser} text={t('Cancel')} styles={{
                                    root: {
                                        margin: '0 4px'
                                    }
                                }} />
                            </div>
                        </Stack.Item>
                    </Stack>
                </Modal>
                <Modal isOpen={addStudentDialogIsOpen} onDismiss={toggleAddStudentDialogIsOpen}>
                    <Stack>
                        <div style={{
                            borderTop: `4px solid ${getTheme().palette.themePrimary}`
                        }}></div>
                        <Text variant={'xLarge'} styles={{
                            root: {
                                color: getTheme().palette.themePrimary,
                                padding: '16px 46px 20px 24px'
                            }
                        }}>{t('Add student')}</Text>
                        <Stack.Item styles={{
                            root: {
                                padding: '0px 24px 24px'
                            }
                        }}>
                            <Stack tokens={{
                                childrenGap: 25
                            }}>
                                <Stack.Item>
                                    <TextField placeholder="ID" value={id} underlined onChange={(event, value) => setId(value ?? '')}></TextField>
                                </Stack.Item>
                                <Stack.Item>
                                    <TextField placeholder={t('Name')} value={name} underlined onChange={(event, value) => setName(value ?? '')}></TextField>
                                </Stack.Item>
                                <Stack.Item>
                                    <TextField type="password" placeholder={t('Password')} value={password} underlined onChange={(event, value) => setPassword(value ?? '')}></TextField>
                                </Stack.Item>
                            </Stack>
                            <div style={{
                                margin: '16px 0px 0px',
                                textAlign: 'right',
                                marginRight: '-4px'
                            }}>
                                <PrimaryButton disabled={!id || !name || !password} styles={{
                                    root: {
                                        margin: '0 4px'
                                    }
                                }} onClick={() => {
                                    fetch(props.domain + '/people', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            id: id,
                                            name: name,
                                            password: password,
                                            type: 'student'
                                        }),
                                        headers: new Headers({
                                            'Authorization': localStorage.getItem('token') ?? "",
                                            'School': localStorage.getItem('schoolId') ?? "",
                                            'Content-Type': 'application/json'
                                        })
                                    }).then(res => {
                                        if (res.status === 201) {
                                            toggleAddStudentDialogIsOpen();
                                            setId('');
                                            setName('');
                                            setPassword('');
                                            setSubject('');
                                        }
                                    });
                                }} text={t('Add')} />
                                <DefaultButton onClick={toggleAddStudentDialogIsOpen} text={t('Cancel')} styles={{
                                    root: {
                                        margin: '0 4px'
                                    }
                                }} />
                            </div>
                        </Stack.Item>
                    </Stack>
                </Modal>
                <Modal isOpen={addParentDialogIsOpen} onDismiss={toggleAddParentDialogIsOpen}>
                    <Stack>
                        <div style={{
                            borderTop: `4px solid ${getTheme().palette.themePrimary}`
                        }}></div>
                        <Text variant={'xLarge'} styles={{
                            root: {
                                color: getTheme().palette.themePrimary,
                                padding: '16px 46px 20px 24px'
                            }
                        }}>{t('Add parent')}</Text>
                        <Stack.Item styles={{
                            root: {
                                padding: '0px 24px 24px'
                            }
                        }}>
                            <Stack tokens={{
                                childrenGap: 25
                            }}>
                                <Stack.Item>
                                    <TextField placeholder="ID" value={id} underlined onChange={(event, value) => setId(value ?? '')}></TextField>
                                </Stack.Item>
                                <Stack.Item>
                                    <TextField placeholder={t('Name')} value={name} underlined onChange={(event, value) => setName(value ?? '')}></TextField>
                                </Stack.Item>
                                <Stack.Item>
                                    <TextField type="password" placeholder={t('Password')} value={password} underlined onChange={(event, value) => setPassword(value ?? '')}></TextField>
                                </Stack.Item>
                                <Stack.Item>
                                    <Dropdown placeholder={t('Child')} onChange={(event, value) => setChild(value?.key.toString() ?? '')} options={people.filter(x => x.type === 'Student').map(x => {
                                        return { key: x.id, text: x.name };
                                    })} />
                                </Stack.Item>
                            </Stack>
                            <div style={{
                                margin: '16px 0px 0px',
                                textAlign: 'right',
                                marginRight: '-4px'
                            }}>
                                <PrimaryButton disabled={!id || !name || !password || !child} styles={{
                                    root: {
                                        margin: '0 4px'
                                    }
                                }} onClick={() => {
                                    fetch(props.domain + '/people', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            id: id,
                                            name: name,
                                            password: password,
                                            type: 'parent',
                                            child: child
                                        }),
                                        headers: new Headers({
                                            'Authorization': localStorage.getItem('token') ?? "",
                                            'School': localStorage.getItem('schoolId') ?? "",
                                            'Content-Type': 'application/json'
                                        })
                                    }).then(res => {
                                        if (res.status === 201) {
                                            toggleAddParentDialogIsOpen();
                                            setId('');
                                            setName('');
                                            setPassword('');
                                            setSubject('');
                                        }
                                    });
                                }} text={t('Add')} />
                                <DefaultButton onClick={toggleAddParentDialogIsOpen} text={t('Cancel')} styles={{
                                    root: {
                                        margin: '0 4px'
                                    }
                                }} />
                            </div>
                        </Stack.Item>
                    </Stack>
                </Modal>
                <Modal isOpen={addTeacherDialogIsOpen} onDismiss={toggleHideAddTeacherDialogIsOpen}>
                    <Stack>
                        <div style={{
                            borderTop: `4px solid ${getTheme().palette.themePrimary}`
                        }}></div>
                        <Text variant={'xLarge'} styles={{
                            root: {
                                color: getTheme().palette.themePrimary,
                                padding: '16px 46px 20px 24px'
                            }
                        }}>{t('Add teacher')}</Text>
                        <Stack.Item styles={{
                            root: {
                                padding: '0px 24px 24px'
                            }
                        }}>
                            <Stack tokens={{
                                childrenGap: 25
                            }}>
                                <Stack.Item>
                                    <TextField placeholder="ID" value={id} underlined onChange={(event, value) => setId(value ?? '')}></TextField>
                                </Stack.Item>
                                <Stack.Item>
                                    <TextField placeholder={t('Name')} value={name} underlined onChange={(event, value) => setName(value ?? '')}></TextField>
                                </Stack.Item>
                                <Stack.Item>
                                    <TextField placeholder={t('Subject')} value={subject} underlined onChange={(event, value) => setSubject(value ?? '')}></TextField>
                                </Stack.Item>
                                <Stack.Item>
                                    <TextField type="password" placeholder={t('Password')} value={password} underlined onChange={(event, value) => setPassword(value ?? '')}></TextField>
                                </Stack.Item>
                            </Stack>
                            <div style={{
                                margin: '16px -4px 0px 0px',
                                textAlign: 'right'
                            }}>
                                <PrimaryButton disabled={!id || !name || !password} styles={{
                                    root: {
                                        margin: '0 4px'
                                    }
                                }} onClick={() => {
                                    fetch(props.domain + '/people', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            id: id,
                                            name: name,
                                            password: password,
                                            subject: subject,
                                            type: 'teacher'
                                        }),
                                        headers: new Headers({
                                            'Authorization': localStorage.getItem('token') ?? "",
                                            'School': localStorage.getItem('schoolId') ?? "",
                                            'Content-Type': 'application/json'
                                        })
                                    }).then(res => {
                                        if (res.status === 201) {
                                            toggleHideAddTeacherDialogIsOpen();
                                            setId('');
                                            setName('');
                                            setPassword('');
                                            setSubject('');
                                        }
                                    });
                                }} text={t('Add')} />
                                <DefaultButton onClick={toggleHideAddTeacherDialogIsOpen} text={t('Cancel')} styles={{
                                    root: {
                                        margin: '0 4px'
                                    }
                                }} />
                            </div>
                        </Stack.Item>
                    </Stack>
                </Modal>
                <Modal isOpen={addAdministratorDialogIsOpen} onDismiss={aeHideAddAdministratorDialogIsOpen}>
                    <Stack>
                        <div style={{
                            borderTop: `4px solid ${getTheme().palette.themePrimary}`
                        }}></div>
                        <Text variant={'xLarge'} styles={{
                            root: {
                                color: getTheme().palette.themePrimary,
                                padding: '16px 46px 20px 24px'
                            }
                        }}>{t('Add administrator')}</Text>
                        <Stack.Item styles={{
                            root: {
                                padding: '0px 24px 24px'
                            }
                        }}>
                            <Stack tokens={{
                                childrenGap: 25
                            }}>
                                <Stack.Item>
                                    <TextField placeholder="ID" value={id} underlined onChange={(event, value) => setId(value ?? '')}></TextField>
                                </Stack.Item>
                                <Stack.Item>
                                    <TextField placeholder={t('Name')} value={name} underlined onChange={(event, value) => setName(value ?? '')}></TextField>
                                </Stack.Item>
                                <Stack.Item>
                                    <TextField type="password" placeholder={t('Password')} value={password} underlined onChange={(event, value) => setPassword(value ?? '')}></TextField>
                                </Stack.Item>
                            </Stack>
                            <div style={{
                                margin: '16px 0px 0px',
                                textAlign: 'right',
                                marginRight: '-4px'
                            }}>
                                <PrimaryButton disabled={!id || !name || !password} styles={{
                                    root: {
                                        margin: '0 4px'
                                    }
                                }} onClick={() => {
                                    fetch(props.domain + '/people', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            id: id,
                                            name: name,
                                            password: password,
                                            type: 'administrator'
                                        }),
                                        headers: new Headers({
                                            'Authorization': localStorage.getItem('token') ?? "",
                                            'School': localStorage.getItem('schoolId') ?? "",
                                            'Content-Type': 'application/json'
                                        })
                                    }).then(res => {
                                        if (res.status === 201) {
                                            aeHideAddAdministratorDialogIsOpen();
                                            setId('');
                                            setName('');
                                            setPassword('');
                                            setSubject('');
                                        }
                                    });;
                                }} text={t('Add')} />
                                <DefaultButton onClick={aeHideAddAdministratorDialogIsOpen} text={t('Cancel')} styles={{
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
                    <DialogFooter>
                        <PrimaryButton onClick={() => {
                            fetch(props.domain + '/people', {
                                method: 'DELETE',
                                body: JSON.stringify({
                                    tos: (selection as PersonSelect[]).map(x => x.ID)
                                }),
                                headers: new Headers({
                                    'Authorization': localStorage.getItem('token') ?? "",
                                    'School': localStorage.getItem('schoolId') ?? "",
                                    'Content-Type': 'application/json'
                                })
                            }).then(res => {
                                if (res.status === 200) {
                                    toggleHideDeleteDialog();
                                }
                            });
                        }} text={t('Delete')} />
                        <DefaultButton onClick={toggleHideDeleteDialog} text={t('Cancel')} />
                    </DialogFooter>
                </Dialog>
            </Stack.Item>
            <Stack.Item>
                <DetailsList setKey='ID' selection={selectionConst} selectionMode={SelectionMode.multiple} selectionPreservedOnEmptyClick items={(typeof searchFound !== 'boolean' ? searchFound.map(x => {
                    return {
                        ID: x.id,
                        Name: x.name,
                        Subject: x.subject ?? 'N/A',
                        Child: x.type === 'Parent' ? x.child?.name : 'N/A',
                        Type: x.type
                    }
                }) : people.map(x => {
                    return {
                        ID: x.id,
                        Name: x.name,
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