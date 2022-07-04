import React, { createRef, useEffect, useState } from 'react';
import { IDropdownOption, DropdownMenuItemType, Stack, IconButton, Dropdown, TextField, DefaultButton, PrimaryButton, DatePicker, DayOfWeek } from '@fluentui/react';
import { NeutralColors } from '@fluentui/theme';
import { Activity, IdPlusName, SimpleUser, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const EditActivity = (props: { domain: string | undefined; info: User; oldActivity: Activity; editActivity: boolean; setEditActivity: (value: React.SetStateAction<boolean>) => void; }) => {

    const input = createRef<HTMLInputElement>();

    const [title, setTitle] = useState('');
    const [type, setType] = useState('');
    const [delivery, setDelivery] = useState('');
    const [description, setDescription] = useState('');
    const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
    const [receivers, setReceivers] = useState<IDropdownOption[]>([]);
    const [receiver, setReceiver] = useState<string[]>([]);
    const [oldFiles, setOldFiles] = useState<IdPlusName[]>([]);
    const [files, setFiles] = useState<any[]>([]);

    useEffect(() => {
        setTitle(props.oldActivity?.title);
        setType(props.oldActivity?.type);
        setDelivery(props.oldActivity?.delivery);
        setDescription(props.oldActivity?.description);
        setReceiver(props.oldActivity?.receiver);
        setOldFiles(props.oldActivity?.files);
    }, []);

    const { t } = useTranslation();

    useEffect(() => {
        if (props.info) {
            setReceivers(() => {
                let thingy: IDropdownOption[] = [];
                thingy.push({ key: 'selectors', text: t('Selectors'), itemType: DropdownMenuItemType.Header });
                thingy.push({ key: 'all', text: t('All') });
                thingy.push({ key: 'studentsHeader', text: t('Students'), itemType: DropdownMenuItemType.Header });
                thingy = thingy.concat(props.info.avaliable.filter((x: SimpleUser) => !x.teacher && !x.child).map((x: SimpleUser) => { return { key: x.id, text: x.name }; }));
                return thingy;
            });
        }
    }, [props.info]);

    return (
        <Stack styles={{
            root: {
                padding: 25
            }
        }}>
            <Stack.Item styles={{
                root: {
                    marginBottom: 25
                }
            }}>
                <Dropdown placeholder={t('Select receivers')} selectedKeys={receiver} onChange={(event, item) => {
                    if (item && item.key !== 'all' && item.key !== 'allStudents' && item.key !== 'allParents' && item.key !== 'allTeachers') {
                        setReceiver(
                            item.selected ? [...receiver, item.key as string] : receiver.filter(key => key !== item.key),
                        );
                    } else if (item?.key === 'all') {
                        if (receiver.sort().join() !== props.info.avaliable.map((x: SimpleUser) => x.id).sort().join()) {
                            setReceiver(props.info.avaliable.map((x: SimpleUser) => x.id));
                        } else {
                            setReceiver([]);
                        }
                    }
                }} multiSelect options={receivers} />
            </Stack.Item>
            <Stack.Item styles={{
                root: {
                    marginBottom: 25
                }
            }}>
                <Stack horizontal>
                    <Stack.Item styles={{
                        root: {
                            width: '100%'
                        }
                    }}>
                        <DatePicker firstDayOfWeek={DayOfWeek.Sunday} placeholder={t('Select expiration date...')} value={expirationDate} onSelectDate={date => date !== null && setExpirationDate(date)} />
                    </Stack.Item>
                    <Stack.Item>
                        <IconButton iconProps={{
                            iconName: 'ChromeClose'
                        }} onClick={() => setExpirationDate(undefined)} />
                    </Stack.Item>
                </Stack>
            </Stack.Item>
            <Stack.Item>
                <TextField placeholder={t('Title')} value={title} underlined onChange={(event, value) => setTitle(value ?? '')}></TextField>
            </Stack.Item>
            <Stack.Item>
                <TextField placeholder={t('Type')} value={type} underlined onChange={(event, value) => setType(value ?? '')}></TextField>
            </Stack.Item>
            <Stack.Item>
                <TextField placeholder={t('Delivery')} value={delivery} underlined onChange={(event, value) => setDelivery(value ?? '')}></TextField>
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
                <TextField placeholder={t('Description')} rows={3} multiline onChange={(event, value) => {
                    setDescription(value ?? '');
                }} />
            </Stack.Item>
            <Stack.Item>
                <Stack horizontal styles={{
                    root: {
                        justifyContent: 'space-between'
                    }
                }}>
                    <Stack.Item>
                        <PrimaryButton text={t('Edit activity')} iconProps={{ iconName: 'Edit' }} onClick={() => {
                            const thingy: File[] = files.map(x => Array.from(x)).flat() as File[];
                            if (thingy.length > 0) {
                                let filesIds: string[] = [];
                                thingy.forEach((file: File) => {
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
                                            fetch(props.domain + '/activities/' + props.oldActivity?.id, {
                                                method: 'PATCH',
                                                body: JSON.stringify({
                                                    title: title,
                                                    description: description,
                                                    files: oldFiles.concat(filesIds.map((x, i) => { return { id: x, name: thingy[i].name }; })),
                                                    type: type,
                                                    delivery: delivery,
                                                    expiration: expirationDate ? expirationDate.getTime() : false,
                                                    receiver: receiver
                                                }),
                                                headers: new Headers({
                                                    'Authorization': localStorage.getItem('token') ?? "",
                                                    'School': localStorage.getItem('schoolId') ?? "",
                                                    'Content-Type': 'application/json'
                                                })
                                            })
                                                .then(res => {
                                                    if (res.status === 200) {
                                                        setTitle('');
                                                        setType('');
                                                        setDelivery('');
                                                        setDescription('');
                                                        setExpirationDate(undefined);
                                                        setReceiver([]);
                                                        setFiles([]);
                                                        props.setEditActivity(false);
                                                    }
                                                });
                                        }
                                    });
                                });
                            } else {
                                fetch(props.domain + '/activities/' + props.oldActivity?.id, {
                                    method: 'PATCH',
                                    body: JSON.stringify({
                                        title: title,
                                        description: description,
                                        type: type,
                                        delivery: delivery,
                                        expiration: expirationDate ? expirationDate.getTime() : false,
                                        receiver: receiver
                                    }),
                                    headers: new Headers({
                                        'Authorization': localStorage.getItem('token') ?? "",
                                        'School': localStorage.getItem('schoolId') ?? "",
                                        'Content-Type': 'application/json'
                                    })
                                })
                                    .then(res => {
                                        if (res.status === 200) {
                                            setTitle('');
                                            setType('');
                                            setDelivery('');
                                            setDescription('');
                                            setExpirationDate(undefined);
                                            setReceiver([]);
                                            setFiles([]);
                                            props.setEditActivity(false);
                                        }
                                    });
                            }

                        }} disabled={(!(title?.length > 0)) || (!(receiver.length > 0))} />
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
    );
};

export default EditActivity;