import React, { createRef, useEffect, useState } from 'react';
import { IDropdownOption, DropdownMenuItemType, Stack, IconButton, Dropdown, TextField, DefaultButton, PrimaryButton } from '@fluentui/react';
import { NeutralColors } from '@fluentui/theme';
import { Editor } from 'ckeditor5-custom-build/build/ckeditor';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { SimpleUser, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const NewMessage = (props: { domain: string | undefined; newMessage: boolean; setNewMessage: (value: React.SetStateAction<boolean>) => void; info: User; }) => {

    const inputPdf = createRef<HTMLInputElement>();
    const inputAttach = createRef<HTMLInputElement>();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [receivers, setReceivers] = useState<IDropdownOption[]>([]);
    const [receiver, setReceiver] = useState<string[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [pdf, setPdf] = useState<File | null>(null);

    const { t } = useTranslation();

    useEffect(() => {
        if (props.info) {
            setReceivers(() => {
                let thingy: IDropdownOption[] = [];
                thingy.push({ key: 'selectors', text: t('Selectors'), itemType: DropdownMenuItemType.Header });
                thingy.push({ key: 'all', text: t('All') });
                if (props.info?.teacher) {
                    thingy.push({ key: 'allStudents', text: t('All students') });
                    thingy.push({ key: 'allParents', text: t('All parents') });
                    thingy.push({ key: 'allTeachers', text: t('All teachers') });
                    thingy.push({ key: 'parentsHeader', text: t('Parents'), itemType: DropdownMenuItemType.Header });
                    thingy = thingy.concat(props.info?.avaliable.filter((x: SimpleUser) => x.type === 'Parent').map((x: SimpleUser) => { return { key: x.id, text: x.name }; }));
                    thingy.push({ key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },);
                    thingy.push({ key: 'teachersHeader', text: t('Teachers'), itemType: DropdownMenuItemType.Header });
                    thingy = thingy.concat(props.info?.avaliable.filter((x: SimpleUser) => x.type === 'Teacher').map((x: SimpleUser) => { return { key: x.id, text: x.name }; }));
                    thingy.push({ key: 'studentsHeader', text: t('Students'), itemType: DropdownMenuItemType.Header });
                    thingy = thingy.concat(props.info?.avaliable.filter((x: SimpleUser) => x.type === 'Student').map((x: SimpleUser) => { return { key: x.id, text: x.name }; }));
                } else {
                    thingy.push({ key: 'allTeachers', text: t('All teachers') });
                    thingy.push({ key: 'teachersHeader', text: t('Teachers'), itemType: DropdownMenuItemType.Header });
                    thingy = thingy.concat(props.info?.avaliable.filter((x: SimpleUser) => x.type === 'Teacher').map((x: SimpleUser) => { return { key: x.id, text: x.name }; }));
                }
                return thingy;
            });
        }
    }, [props.info]);

    return (
        <Stack>
            <Stack styles={{
                root: {
                    marginBottom: 25
                }
            }}>
                <Stack.Item styles={{
                    root: {
                        position: 'absolute',
                        right: 0
                    }
                }}>
                    <IconButton iconProps={{ iconName: 'ChromeClose' }} onClick={() => props.setNewMessage(false)} />
                </Stack.Item>
            </Stack>
            <Stack styles={{
                root: {
                    padding: 25
                }
            }}>
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
                            if (receiver.sort().join() !== props.info.avaliable.map((x: SimpleUser) => x.id).sort().join()) {
                                setReceiver(props.info?.avaliable.map((x: SimpleUser) => x.id));
                            } else {
                                setReceiver([]);
                            }
                        } else if (item?.key === 'allStudents') {
                            const thingy = props.info?.avaliable.filter((x: SimpleUser) => !x.teacher && !x.child).map((x: SimpleUser) => x.id);
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
                            const thingy = props.info?.avaliable.filter((x: SimpleUser) => x.child).map((x: SimpleUser) => x.id);
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
                            const thingy = props.info?.avaliable.filter((x: SimpleUser) => x.teacher).map((x: SimpleUser) => x.id);
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
                    {(files.map(x => Array.from(x)).flat() as File[]).map((file: File, i) => file ? <DefaultButton key={i} onClick={() => {
                        setFiles(Files => {
                            let preFiles = Files.map(x => Array.from(x)).flat();
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
                    {!pdf ? <CKEditor editor={Editor} config={{
                        simpleUpload: {
                            uploadUrl: props.domain + '/upload',
                            headers: {
                                'Authorization': localStorage.getItem('token') ?? "",
                                'School': localStorage.getItem('schoolId') ?? ""
                            }
                        }
                    }} onChange={(event: Event, editor: typeof Editor) => {
                        const data = editor.getData();
                        setContent(data);
                    }} /> : <iframe src={URL.createObjectURL(pdf)} style={{
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
                            <PrimaryButton text={t('Send message')} iconProps={{ iconName: 'Send' }} onClick={() => {
                                const thingy: File[] = (pdf ? [pdf] : []).concat(files.map(x => Array.from(x)).flat() as File[]);
                                if (thingy.length > 0) {
                                    let filesIds: string[] = [];
                                    thingy.forEach((file: File, i) => {
                                        const form = new FormData();
                                        form.append('upload', file);
                                        fetch(props.domain + '/upload', {
                                            method: 'POST',
                                            body: form,
                                            headers: new Headers({
                                                'Authorization': localStorage.getItem('token') ?? "",
                                                'School': localStorage.getItem('schoolId') ?? ""
                                            })
                                        }).then(res => res.json()).then(json => {
                                            filesIds.push(json.id);
                                            if (thingy.length === filesIds.length) {
                                                fetch(props.domain + '/messages', {
                                                    method: 'POST',
                                                    body: JSON.stringify({
                                                        title: title,
                                                        content: !pdf ? content : {
                                                            pdf: filesIds[0]
                                                        },
                                                        files: filesIds.map((x, i) => { return { id: x, name: thingy[i].name }; }).filter((x, i) => !(pdf && i === 0)),
                                                        receiver: receiver
                                                    }),
                                                    headers: new Headers({
                                                        'Authorization': localStorage.getItem('token') ?? "",
                                                        'School': localStorage.getItem('schoolId') ?? "",
                                                        'Content-Type': 'application/json'
                                                    })
                                                })
                                                    .then(res => {
                                                        if (res.status === 201) {
                                                            setTitle('');
                                                            setContent('');
                                                            setPdf(null);
                                                            setReceiver([]);
                                                            setFiles([]);
                                                            props.setNewMessage(false);
                                                        }
                                                    });
                                            }
                                        });
                                    });
                                } else {
                                    fetch(props.domain + '/messages', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            title: title,
                                            content: content,
                                            receiver: receiver
                                        }),
                                        headers: new Headers({
                                            'Authorization': localStorage.getItem('token') ?? "",
                                            'School': localStorage.getItem('schoolId') ?? "",
                                            'Content-Type': 'application/json'
                                        })
                                    })
                                        .then(res => {
                                            if (res.status === 201) {
                                                setTitle('');
                                                setContent('');
                                                setPdf(null);
                                                setReceiver([]);
                                                setFiles([]);
                                                props.setNewMessage(false);
                                            }
                                        });
                                }

                            }} disabled={(!(title?.length > 0)) || ((!(content.length > 0)) && !pdf) || (!(receiver.length > 0))} />
                        </Stack.Item>
                        <Stack.Item>
                            <input type="file" ref={inputPdf} multiple style={{
                                display: 'none'
                            }} onChange={event => {
                                if (event.target.files) {
                                    setPdf(event.target.files[0]);
                                }
                            }} />
                            {!pdf ? <DefaultButton text={t('Import PDF')} iconProps={{ iconName: 'PDF' }} onClick={() => {
                                inputPdf.current?.click();
                            }} /> : <DefaultButton text={t('Remove PDF')} iconProps={{ iconName: 'TextDocument' }} onClick={() => {
                                setPdf(null);
                            }} />}
                        </Stack.Item>
                        <Stack.Item>
                            <input type="file" ref={inputAttach} multiple style={{
                                display: 'none'
                            }} onChange={event => {
                                setFiles(Files => [...Array.from(Files), event.target.files]);
                            }} />
                            <DefaultButton text={t('Add attachments')} iconProps={{ iconName: 'Attach' }} onClick={() => {
                                inputAttach.current?.click();
                            }} />
                        </Stack.Item>
                    </Stack>
                </Stack.Item>
            </Stack>
        </Stack>
    );
};

export default NewMessage;