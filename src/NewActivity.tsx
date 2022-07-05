import React, { createRef, useEffect, useState } from 'react';
import { IDropdownOption, DropdownMenuItemType, Stack, IconButton, Dropdown, TextField, DefaultButton, PrimaryButton, DatePicker, DayOfWeek, MessageBar, MessageBarType } from '@fluentui/react';
import { NeutralColors } from '@fluentui/theme';
import { IdPlusUrl, SimpleUser, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const NewActivity = (props: { domain: string | undefined; info: User; newActivity: boolean; setNewActivity: (value: React.SetStateAction<boolean>) => void; }) => {

    const input = createRef<HTMLInputElement>();

    const [title, setTitle] = useState('');
    const [type, setType] = useState('');
    const [delivery, setDelivery] = useState('');
    const [description, setDescription] = useState('');
    const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
    const [receivers, setReceivers] = useState<IDropdownOption[]>([]);
    const [receiver, setReceiver] = useState<string[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [error, setError] = useState('');

    const { t } = useTranslation();

    useEffect(() => {
        if (props.info) {
            setReceivers(() => {
                let thingy: IDropdownOption[] = [];
                thingy.push({ key: 'selectors', text: t('Selectors'), itemType: DropdownMenuItemType.Header });
                thingy.push({ key: 'all', text: t('All') });
                thingy.push({ key: 'studentsHeader', text: t('Students'), itemType: DropdownMenuItemType.Header });
                thingy = thingy.concat(props.info.avaliable.filter((x: SimpleUser) => x.type === 'Student').map((x: SimpleUser) => { return { key: x.id, text: x.name }; }));
                return thingy;
            });
        }
    }, [props.info]);

    return (
        <Stack>
            {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')} styles={{
                root: {
                    marginBottom: 25
                }
            }}>
                {t(error)}
            </MessageBar> : null}
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
                    <IconButton iconProps={{ iconName: 'ChromeClose' }} onClick={() => props.setNewActivity(false)} />
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
                            <PrimaryButton text={t('Send activity')} iconProps={{ iconName: 'Send' }} onClick={() => {
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
                                            'School': localStorage.getItem('schoolId') ?? ""
                                        })
                                    }).then(res => res.json()).then(json => {
                                        if (!json?.error) {
                                            fetch(props.domain + '/activities', {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    title: title,
                                                    description: description,
                                                    files: (json as IdPlusUrl[]).map(x => x.id).map((x, i) => { return { id: x, name: thingy[i].name }; }),
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
                                                .then(res => res.json()).then(json => {
                                                    if (!json?.error) {
                                                        setTitle('');
                                                        setType('');
                                                        setDelivery('');
                                                        setDescription('');
                                                        setExpirationDate(undefined);
                                                        setReceiver([]);
                                                        setFiles([]);
                                                        props.setNewActivity(false);
                                                    } else {
                                                        setError(json.error);
                                                    }
                                                });
                                        } else {
                                            setError(json.error);
                                        }
                                    });
                                } else {
                                    fetch(props.domain + '/activities', {
                                        method: 'POST',
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
                                        .then(res => res.json()).then(json => {
                                            if (!json?.error) {
                                                setTitle('');
                                                setType('');
                                                setDelivery('');
                                                setDescription('');
                                                setExpirationDate(undefined);
                                                setReceiver([]);
                                                setFiles([]);
                                                props.setNewActivity(false);
                                            } else {
                                                setError(json.error);
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
        </Stack>
    );
};

export default NewActivity;