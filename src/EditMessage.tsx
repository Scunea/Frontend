import React, { createRef, useEffect, useState } from 'react';
import { IDropdownOption, DropdownMenuItemType, Stack, Dropdown, TextField, DefaultButton, PrimaryButton, MessageBar, MessageBarType } from '@fluentui/react';
import { NeutralColors } from '@fluentui/theme';
import { Editor } from 'ckeditor5-custom-build/build/ckeditor';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { IdPlusName, IdPlusUrl, Message, SimpleUser, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const EditMessage = (props: { domain: string | undefined; oldMessage: Message; editMessage: boolean; setEditMessage: (value: React.SetStateAction<boolean>) => void; info: User; }) => {

    const input = createRef<HTMLInputElement>();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [receivers, setReceivers] = useState<IDropdownOption[]>([]);
    const [receiver, setReceiver] = useState<string[]>([]);
    const [oldFiles, setOldFiles] = useState<IdPlusName[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        setTitle(props.oldMessage?.title);
        setContent(props.oldMessage?.content);
        setReceiver(props.oldMessage?.receiver.map((x: IdPlusName) => x.id).filter((x: string) => x !== props.info?.id));
        setOldFiles(props.oldMessage?.files);
    }, []);

    const { t } = useTranslation();

    useEffect(() => {
        if (props.info) {
            setReceivers(() => {
                const administrators = props.info?.available.filter((x: SimpleUser) => x.type === 'administrator');
                const teachers = props.info?.available.filter((x: SimpleUser) => x.type === 'teacher');
                const students = props.info?.available.filter((x: SimpleUser) => x.type === 'student');
                const parents = props.info?.available.filter((x: SimpleUser) => x.type === 'parent');

                let thingy: IDropdownOption[] = [];
                thingy.push({ key: 'selectors', text: t('Selectors'), itemType: DropdownMenuItemType.Header });
                thingy.push({ key: 'all', text: t('All') });
                if (props.info?.teacher || props.info?.administrator) {
                    if(administrators?.length > 0) {
                        thingy.push({ key: 'allAdministrators', text: t('All administrators') });
                    }
                    if(teachers?.length > 0) {
                        thingy.push({ key: 'allTeachers', text: t('All teachers') });
                    }
                    if(students?.length > 0) {
                        thingy.push({ key: 'allStudents', text: t('All students') });
                    }
                    if(parents?.length > 0) {
                        thingy.push({ key: 'allParents', text: t('All parents') });
                    }
                    thingy.push({ key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider });
                    if(administrators?.length > 0) {
                        thingy.push({ key: 'administratorsHeader', text: t('Administrators'), itemType: DropdownMenuItemType.Header });
                        thingy = thingy.concat(administrators?.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }));
                    }
                    if(teachers?.length > 0) {
                        thingy.push({ key: 'teachersHeader', text: t('Teachers'), itemType: DropdownMenuItemType.Header });
                        thingy = thingy.concat(teachers?.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }));
                    }
                    if(students?.length > 0) {
                        thingy.push({ key: 'studentsHeader', text: t('Students'), itemType: DropdownMenuItemType.Header });
                        thingy = thingy.concat(students.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }));
                    }
                    if(parents?.length > 0) {
                        thingy.push({ key: 'parentsHeader', text: t('Parents'), itemType: DropdownMenuItemType.Header });
                        thingy = thingy.concat(parents.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }));
                    }
                } else {
                    if(administrators?.length > 0) {
                        thingy.push({ key: 'allAdministrators', text: t('All administrators') });
                    }
                    if(teachers?.length > 0) {
                        thingy.push({ key: 'allTeachers', text: t('All teachers') });
                    }
                    thingy.push({ key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider });
                    if(administrators?.length > 0) {
                        thingy.push({ key: 'administratorsHeader', text: t('Administrators'), itemType: DropdownMenuItemType.Header });
                        thingy = thingy.concat(administrators?.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }));
                    }
                    if(teachers?.length > 0) {
                        thingy.push({ key: 'teachersHeader', text: t('Teachers'), itemType: DropdownMenuItemType.Header });
                        thingy = thingy.concat(teachers?.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }));
                    }
                }
                return thingy;
            });
        }
    }, [props.info]);

    return (
        <Stack>
            <Stack styles={{
                root: {
                    padding: 25
                }
            }}>
                {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')} styles={{
                    root: {
                        marginBottom: 25
                    }
                }}>
                    {t(error)}
                </MessageBar> : null}
                <Stack.Item styles={{
                    root: {
                        marginBottom: 25
                    }
                }} >
                    <Dropdown placeholder={t('Select receivers')} selectedKeys={receiver} onChange={(event, item) => {
                        if (item && item.key !== 'all' && item.key !== 'allStudents' && item.key !== 'allParents' && item.key !== 'allTeachers') {
                            setReceiver(
                                item.selected ? [...receiver, item.key as string] : receiver.filter(key => key !== item.key),
                            );
                        } else if (item?.key === 'all') {
                            if (receiver.sort().join() !== props.info.available.map((x: SimpleUser) => x.id).sort().join()) {
                                setReceiver(props.info?.available.map((x: SimpleUser) => x.id));
                            } else {
                                setReceiver([]);
                            }
                        } else if (item?.key === 'allStudents') {
                            const thingy = props.info?.available.filter((x: SimpleUser) => x.type === 'student').map((x: SimpleUser) => x.id);
                            let found = 0;
                            thingy.forEach((x: string) => {
                                if (receiver.includes(x)) {
                                    found++;
                                }
                            });
                            if (found !== thingy.length) {
                                setReceiver(Receiver => {
                                    let newReceiver = [...Receiver];
                                    thingy.forEach((x: string) => {
                                        if (!newReceiver.includes(x)) {
                                            newReceiver.push(x);
                                        }
                                    });
                                    return newReceiver;
                                });
                            } else {
                                setReceiver(Receiver => {
                                    let newReceiver = [...Receiver];
                                    thingy.forEach((x: string) => {
                                        newReceiver.splice(newReceiver.indexOf(x), 1)
                                    })
                                    return newReceiver;
                                });
                            }
                        } else if (item?.key === 'allAdministrators') {
                            const thingy = props.info?.available.filter((x: SimpleUser) => x.type === 'administrator').map((x: SimpleUser) => x.id);
                            let found = 0;
                            thingy.forEach((x: string) => {
                                if (receiver.includes(x)) {
                                    found++;
                                }
                            });
                            if (found !== thingy.length) {
                                setReceiver(Receiver => {
                                    let newReceiver = [...Receiver];
                                    thingy.forEach((x: string) => {
                                        if (!newReceiver.includes(x)) {
                                            newReceiver.push(x);
                                        }
                                    });
                                    return newReceiver;
                                });
                            } else {
                                setReceiver(Receiver => {
                                    let newReceiver = [...Receiver];
                                    thingy.forEach((x: string) => {
                                        newReceiver.splice(newReceiver.indexOf(x), 1)
                                    })
                                    return newReceiver;
                                });
                            }
                        } else if (item?.key === 'allParents') {
                            const thingy = props.info?.available.filter((x: SimpleUser) => x.type === 'parent').map((x: SimpleUser) => x.id);
                            let found = 0;
                            thingy.forEach((x: string) => {
                                if (receiver.includes(x)) {
                                    found++;
                                }
                            });
                            if (found !== thingy.length) {
                                setReceiver(Receiver => {
                                    let newReceiver = [...Receiver];
                                    thingy.forEach((x: string) => {
                                        if (!newReceiver.includes(x)) {
                                            newReceiver.push(x);
                                        }
                                    });
                                    return newReceiver;
                                });
                            } else {
                                setReceiver(Receiver => {
                                    let newReceiver = [...Receiver];
                                    thingy.forEach((x: string) => {
                                        newReceiver.splice(newReceiver.indexOf(x), 1)
                                    })
                                    return newReceiver;
                                });
                            }
                        } else if (item?.key === 'allTeachers') {
                            const thingy = props.info?.available.filter((x: SimpleUser) => x.type === 'teacher').map((x: SimpleUser) => x.id);
                            let found = 0;
                            thingy.forEach((x: string) => {
                                if (receiver.includes(x)) {
                                    found++;
                                }
                            });
                            if (found !== thingy.length) {
                                setReceiver(Receiver => {
                                    let newReceiver = [...Receiver];
                                    thingy.forEach((x: string) => {
                                        if (!newReceiver.includes(x)) {
                                            newReceiver.push(x);
                                        }
                                    });
                                    return newReceiver;
                                });
                            } else {
                                setReceiver(Receiver => {
                                    let newReceiver = [...Receiver];
                                    thingy.forEach((x: string) => {
                                        newReceiver.splice(newReceiver.indexOf(x), 1)
                                    })
                                    return newReceiver;
                                });
                            }
                        }
                    }} multiSelect options={receivers} />
                </Stack.Item>
                <Stack.Item>
                    <TextField placeholder={t('Title')} value={title} underlined onChange={(event, value) => setTitle(value ?? '')}></TextField>
                </Stack.Item>
                <Stack.Item styles={{
                    root: {
                        backgroundColor: NeutralColors.gray50,
                        width: 'calc(100% - 10px)',
                        padding: 5,
                        overflow: 'auto'
                    }
                }}>
                    {oldFiles.map((file, i) => <DefaultButton key={i} onClick={() => {
                        setOldFiles(oldFiles => {
                            let preFiles = [...oldFiles];
                            preFiles.splice(preFiles.findIndex(x => x.id === file.id), 1);
                            return preFiles;
                        })
                    }} styles={{
                        root: {
                            ':hover': {
                                textDecoration: 'line-through'
                            }
                        }
                    }}>{file.name}</DefaultButton>)}
                    {(files.map(x => Array.from(x)).flat() as File[]).map((file: File, i) => file ? <DefaultButton key={i + oldFiles.length} onClick={() => {
                        setFiles(files => {
                            let preFiles = files.map(x => Array.from(x)).flat();
                            delete preFiles[i];
                            return [preFiles];
                        })
                    }} styles={{
                        root: {
                            ':hover': {
                                textDecoration: 'line-through'
                            }
                        }
                    }}>{file.name}</DefaultButton> : null)}
                </Stack.Item>
                <Stack.Item styles={{
                    root: {
                        marginBottom: 25
                    }
                }}>
                    {!props.oldMessage?.pdf ? <CKEditor editor={Editor} config={{
                        initialData: props.oldMessage?.content,
                        simpleUpload: {
                            uploadUrl: props.domain + '/upload',
                            headers: {
                                'Authorization': localStorage.getItem('token') ?? "",
                                'School': localStorage.getItem('school') ?? "",
                                'simple': "true"
                            }
                        },
                        fontSize: {
                            options: [
                                8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96
                            ]
                        }
                    }} onChange={(event: Event, editor: typeof Editor) => {
                        const data = editor.getData();
                        setContent(data);
                    }} /> : <iframe src={props.domain + '/static/' + props.oldMessage?.pdf} style={{
                        width: '100%',
                        minHeight: 400
                    }}></iframe>}
                </Stack.Item>
                <Stack.Item>
                    <Stack horizontal styles={{
                        root: {
                            justifyContent: 'space-between'
                        }
                    }}>
                        <Stack.Item>
                            <PrimaryButton text={t('Edit message')} iconProps={{ iconName: 'Edit' }} onClick={() => {
                                const thingy: File[] = files.map(x => Array.from(x)).flat() as File[];
                                if (thingy.length > 0) {

                                    const form = new FormData();
                                    thingy.forEach((file: File) => {
                                        form.append('upload', file);
                                    });
                                    fetch(props.domain + '/upload', {
                                        method: 'POST',
                                        body: form,
                                        headers: new Headers({
                                            'Authorization': localStorage.getItem('token') ?? "",
                                            'School': localStorage.getItem('school') ?? ""
                                        })
                                    }).then(res => res.json()).then(json => {
                                        if (!json?.error) {
                                            fetch(props.domain + '/messages/' + props.oldMessage?.id, {
                                                method: 'PATCH',
                                                body: JSON.stringify({
                                                    title: title,
                                                    content: content,
                                                    files: oldFiles.concat((json as IdPlusUrl[]).map(x => x.id).map((x, i) => { return { id: x, name: thingy[i].name }; })),
                                                    receiver: receiver
                                                }),
                                                headers: new Headers({
                                                    'Authorization': localStorage.getItem('token') ?? "",
                                                    'School': localStorage.getItem('school') ?? "",
                                                    'Content-Type': 'application/json'
                                                })
                                            })
                                                .then(res => res.json()).then(json => {
                                                    if (!json?.error) {
                                                        setTitle('');
                                                        setContent('');
                                                        setReceiver([]);
                                                        setFiles([]);
                                                        props.setEditMessage(false);
                                                    } else {
                                                        setError(json.error);
                                                    }
                                                });
                                        } else {
                                            setError(json.error);
                                        }
                                    });
                                } else {
                                    fetch(props.domain + '/messages/' + props.oldMessage?.id, {
                                        method: 'PATCH',
                                        body: JSON.stringify({
                                            title: title,
                                            content: content,
                                            receiver: receiver
                                        }),
                                        headers: new Headers({
                                            'Authorization': localStorage.getItem('token') ?? "",
                                            'School': localStorage.getItem('school') ?? "",
                                            'Content-Type': 'application/json'
                                        })
                                    })
                                        .then(res => res.json()).then(json => {
                                            if (!json?.error) {
                                                setTitle('');
                                                setContent('');
                                                setReceiver([]);
                                                setFiles([]);
                                                props.setEditMessage(false);
                                            } else {
                                                setError(json.error);
                                            }
                                        });
                                }

                            }} disabled={(!(title?.length > 0)) || (!(content?.length > 0) && !props.oldMessage?.pdf) || (!(receiver.length > 0))} />
                        </Stack.Item>
                        <Stack.Item>
                            <input type="file" ref={input} multiple style={{
                                display: 'none'
                            }} onChange={event => {
                                setFiles(Files => [...Array.from(Files), event.target.files]);
                            }} />
                            <DefaultButton text={t('Add attachments')} iconProps={{ iconName: 'Attach' }} onClick={() => {
                                input.current?.click();
                            }} />
                        </Stack.Item>
                    </Stack>
                </Stack.Item>
            </Stack>
        </Stack>
    );
};

export default EditMessage;