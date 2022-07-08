import React, { useState, createRef, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server'
import { Stack, Text, TextField, IconButton, Dialog as DialogMS, DialogType, DialogFooter as DialogFooterMS, PrimaryButton, DefaultButton, DocumentCard, DocumentCardActivity, DocumentCardTitle, Image, Link, SearchBox, TooltipHost, IDialogProps, IDialogFooterProps, MessageBar, MessageBarType } from '@fluentui/react';
import { useBoolean } from '@fluentui/react-hooks';
import { NeutralColors, SharedColors } from '@fluentui/theme';
import { FileIcon, defaultStyles } from 'react-file-icon';
import EditActivity from './EditActivity';
import { Activity, FilesPlusPlus, IdPlusName, IdPlusUrl, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const ReadActivity = (props: { domain: string | undefined; activities: Activity[]; setActivities: (value: React.SetStateAction<Activity[]>) => void; selectedActivity: Activity; setSelectedActivity: (value: React.SetStateAction<Activity | null>) => void; namesFuzzySet: FuzzySet; info: User; }) => {

    const Dialog = (props: IDialogProps & { children: any }) => {
        return <DialogMS {...props}></DialogMS>;
    };

    const DialogFooter = (props: IDialogFooterProps & { children: any }) => {
        return <DialogFooterMS {...props}></DialogFooterMS>;
    };

    const input = createRef<HTMLInputElement>();

    const [reRenderValue, reRender] = useState(true);
    const [hideDeleteDialog, { toggle: toggleHideDeleteDialog }] = useBoolean(true);
    const [editActivity, setEditActivity] = useState(false);
    const [doActivity, { toggle: toggleDoActivity }] = useBoolean(false);
    const [comments, setComments] = useState('');
    const [files, setFiles] = useState<any[]>([]);
    const [delivered, setDelivered] = useState<FilesPlusPlus[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (props.selectedActivity?.author.id === props.info?.id) {
            setDelivered(Object.values(props.selectedActivity?.delivered));
        }
    }, []);

    useEffect(() => {
        props.setSelectedActivity(props.activities.find((x: Activity) => x.id === props.selectedActivity?.id) ?? null);

        if (props.selectedActivity?.author.id === props.info?.id) {
            setDelivered(Object.values(props.selectedActivity?.delivered));
        }

        reRender(!reRenderValue);
    }, [props.activities]);

    const { t } = useTranslation();

    return (<Stack>
        <Stack horizontal>
            {props.selectedActivity?.author.id === props.info?.id || props.info?.administrator ? <><Stack.Item>
                <IconButton iconProps={{ iconName: 'Delete' }} onClick={() => toggleHideDeleteDialog()} />
                <Dialog hidden={hideDeleteDialog} onDismiss={toggleHideDeleteDialog} dialogContentProps={{
                    type: DialogType.largeHeader,
                    title: t('Delete activity?'),
                    subText: t('Do you want to delete this activity?'),
                }}>
                    {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')} >
                        {t(error)}
                    </MessageBar> : null}
                    <DialogFooter>
                        <PrimaryButton onClick={() => {
                            fetch(props.domain + '/activities/' + props.selectedActivity?.id, {
                                method: 'DELETE',
                                headers: new Headers({
                                    'Authorization': localStorage.getItem('token') ?? "",
                                    'School': localStorage.getItem('school') ?? ""
                                })
                            }).then(res => res.json()).then(json => {
                                if (!json?.error) {
                                    toggleHideDeleteDialog();
                                    props.setSelectedActivity(null);
                                } else {
                                    setError(json.error);
                                }
                            });
                        }} text={t('Delete')} />
                        <DefaultButton onClick={toggleHideDeleteDialog} text={t('Cancel')} />
                    </DialogFooter>
                </Dialog>
            </Stack.Item></> : null}
            <IconButton iconProps={{ iconName: editActivity ? 'View' : 'Edit' }} onClick={() => setEditActivity(!editActivity)} />
            <Stack.Item styles={{
                root: {
                    position: 'absolute',
                    right: 0
                }
            }}>
                <IconButton iconProps={{ iconName: 'ChromeClose' }} onClick={() => {
                    props.setSelectedActivity(null);
                }} />
            </Stack.Item>
        </Stack>
        {!editActivity ? (<Stack styles={{
            root: {
                padding: 25
            }
        }}>
            <Stack.Item>
                <Text variant="smallPlus" styles={{
                    root: {
                        color: NeutralColors.gray130
                    }
                }}>{new Date(props.selectedActivity.date).toDateString()} - {props.selectedActivity.expiration ? (new Date(props.selectedActivity.expiration).toDateString()) : t('No expiration')}</Text>
            </Stack.Item>
            <Stack.Item>
                <Text variant="large">{props.selectedActivity?.title}</Text>
            </Stack.Item>
            {(props.selectedActivity?.files?.length ?? 0) > 0 ? <Stack.Item styles={{
                root: {
                    backgroundColor: NeutralColors.gray50,
                    width: '100%',
                    padding: 5,
                    overflow: 'auto'
                }
            }}>
                {props.selectedActivity?.files?.map((file: IdPlusName) => <DefaultButton key={file.id} onClick={() => {
                    let clicky = document.createElement('a');
                    clicky.href = props.domain + '/static/' + file.id + '?name=' + file.name;
                    clicky.download = file.name;
                    clicky.click();
                }}>{file.name}</DefaultButton>)}
            </Stack.Item> : null}
            <Stack.Item>
                <Text>{t('Subject: something by somebody', { subject: props.selectedActivity?.subject, teacher: props.selectedActivity?.author.name })}</Text>
            </Stack.Item>
            <Stack.Item>
                {props.selectedActivity?.type.length > 0 ? <Text>{t('Type: something', { type: props.selectedActivity?.type })}</Text> : null}
            </Stack.Item>
            <Stack.Item styles={{
                root: {
                    marginBottom: 25
                }
            }}>
                {props.selectedActivity?.delivery.length > 0 ? <Text>{t('Delivery: something', { delivery: props.selectedActivity?.delivery })}</Text> : null}
            </Stack.Item>
            <Stack.Item styles={{
                root: {
                    marginBottom: 25
                }
            }}>
                <Text>{props.selectedActivity?.description.length > 0 ? props.selectedActivity?.description : t('No description')}</Text>
            </Stack.Item>
            {props.info?.id !== props.selectedActivity?.author.id && !props.info?.administrator ? (<><Stack.Item styles={{
                root: {
                    marginBottom: 25
                }
            }}>
                <Stack horizontal styles={{
                    root: {
                        justifyContent: 'space-between'
                    }
                }}>
                    <Stack.Item>
                        <DefaultButton styles={{
                            root: {
                                pointerEvents: 'none',
                                backgroundColor: props.selectedActivity?.viewed ? SharedColors.cyanBlue10 : props.selectedActivity?.result === 'Accepted' ? SharedColors.greenCyan10 : props.selectedActivity?.result === 'Rejected' ? SharedColors.red10 : SharedColors.gray20,
                                color: 'white'
                            }
                        }}>{!props.selectedActivity?.result ? props.selectedActivity?.viewed ? t('Viewed') : t('Not viewed') : props.selectedActivity?.result}</DefaultButton>

                    </Stack.Item>
                    {props.selectedActivity?.result !== 'Unchecked' && props.selectedActivity?.result !== 'Accepted' && props.selectedActivity?.result !== 'Rejected' ? <Stack.Item>
                        <DefaultButton text={t('Do activity')} iconProps={{ iconName: 'Edit' }} disabled={props.selectedActivity?.expiration > 0 && props.selectedActivity?.date > props.selectedActivity?.expiration} onClick={toggleDoActivity} />
                    </Stack.Item> : null}
                </Stack>
            </Stack.Item>
                {doActivity ? (<><Stack.Item>
                    <TextField placeholder={t('Comments')} value={comments} underlined onChange={(event, value) => setComments(value ?? '')} multiline rows={3}></TextField>
                </Stack.Item>
                    <Stack.Item styles={{
                        root: {
                            marginBottom: 25
                        }
                    }}> </Stack.Item>
                    <Stack.Item>
                        <Stack horizontal styles={{
                            root: {
                                justifyContent: 'space-between',
                                marginBottom: 25
                            }
                        }}>
                            <Stack.Item>
                                <PrimaryButton text={t('Send to review')} iconProps={{ iconName: 'Send' }} onClick={() => {
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
                                            const filesIds = (json as IdPlusUrl[]).map(x => x.id);
                                            if (!json?.error) {
                                                fetch(props.domain + '/activities/deliver/' + props.selectedActivity?.id, {
                                                    method: 'POST',
                                                    body: JSON.stringify({
                                                        comments: comments,
                                                        files: filesIds.map((x, i) => { return { id: x, name: thingy[i].name }; }),
                                                    }),
                                                    headers: new Headers({
                                                        'Authorization': localStorage.getItem('token') ?? "",
                                                        'School': localStorage.getItem('school') ?? "",
                                                        'Content-Type': 'application/json'
                                                    })
                                                })
                                                    .then(res => res.json()).then(json => {
                                                        if (!json?.error) {
                                                            props.setActivities((activities: Activity[]) => {
                                                                activities[activities.findIndex(x => x.id === props.selectedActivity?.id)].result = 'Unchecked';
                                                                return activities;
                                                            });
                                                            props.setSelectedActivity(null);
                                                            setComments('');
                                                            setFiles([]);
                                                        } else {
                                                            setError(json.error);
                                                        }
                                                    });
                                            } else {
                                                setError(json.error);
                                            }
                                        });
                                    } else {
                                        fetch(props.domain + '/activities/deliver/' + props.selectedActivity?.id, {
                                            method: 'POST',
                                            body: JSON.stringify({
                                                comments: comments
                                            }),
                                            headers: new Headers({
                                                'Authorization': localStorage.getItem('token') ?? "",
                                                'School': localStorage.getItem('school') ?? "",
                                                'Content-Type': 'application/json'
                                            })
                                        })
                                            .then(res => res.json()).then(json => {
                                                if (!json?.error) {
                                                    props.setActivities((activities: Activity[]) => {
                                                        activities[activities.findIndex(x => x.id === props.selectedActivity?.id)].result = 'Unchecked';
                                                        return activities;
                                                    });
                                                    props.setSelectedActivity(null);
                                                    setComments('');
                                                    setFiles([]);
                                                } else {
                                                    setError(json.error);
                                                }
                                            });
                                    }

                                }} disabled={comments.length < 1 && files.map(x => Array.from(x)).flat().length < 1} />

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
                </>) : null}</>) : !props.info?.administrator ? (<>
                    <SearchBox placeholder={t('Search')} underlined onChange={event => {
                        if (event?.target.value) {
                            let searched: FilesPlusPlus[] = [];
                            const found = props.namesFuzzySet?.get(event?.target.value ?? "", null, .1)?.map((x: any) => x[1]);
                            Object.values(props.selectedActivity?.delivered).forEach(activity => {
                                if (found?.includes(activity.name)) {
                                    searched.push(activity);
                                }
                            });
                            setDelivered(searched);
                        } else {
                            setDelivered(Object.values(props.selectedActivity?.delivered));
                        }
                    }} />
                    <Stack horizontal wrap>{delivered.map((thingy, i) => <Stack.Item key={i}><DocumentCard>
                        <Stack>
                            <DocumentCardTitle title={thingy.comments} showAsSecondaryTitle styles={{
                                root: {
                                    marginBottom: 25
                                }
                            }} />
                            <Stack horizontal wrap styles={{
                                root: {
                                    width: '100%',
                                    marginBottom: 25
                                },
                                inner: {
                                    justifyContent: 'center'
                                }
                            }}>
                                {thingy.files.map(file => {
                                    const extension = file.name.split('.')[file.name.split('.').length - 1];
                                    return (
                                        <Stack.Item key={file.id}>
                                            <TooltipHost content={file.name}>
                                                <Link href={props.domain + '/static/' + file.id + '?name=' + file.name} download={file.name}>
                                                    <Image {...{
                                                        src: 'data:image/svg+xml;base64,' + btoa(ReactDOMServer.renderToString(<FileIcon extension={extension} {...(defaultStyles as any)[extension]} />)),
                                                        width: 30,
                                                        height: 30
                                                    }} alt={file.name} />
                                                </Link>
                                            </TooltipHost>
                                        </Stack.Item>
                                    );
                                })}
                            </Stack>
                        </Stack>
                        <Text variant="large" styles={{
                            root: {
                                display: 'table',
                                margin: '0 auto'
                            }
                        }}>{(props.selectedActivity?.result as any)[Object.keys(props.selectedActivity?.delivered)[i]]}</Text>
                        <Stack horizontal styles={{
                            root: {
                                justifyContent: 'space-between',
                                margin: 25
                            }
                        }}>
                            <Stack.Item>
                                <PrimaryButton text={t('Accept')} iconProps={{ iconName: 'Checkmark' }} disabled={(props.selectedActivity?.result as any)[Object.keys(props.selectedActivity?.delivered)[i]] !== 'Unchecked'} onClick={() => {
                                    fetch(props.domain + '/activities/result/' + props.selectedActivity?.id + '/' + Object.keys(props.selectedActivity?.delivered)[i], {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            result: 'Accepted'
                                        }),
                                        headers: new Headers({
                                            'Authorization': localStorage.getItem('token') ?? "",
                                            'School': localStorage.getItem('school') ?? "",
                                            'Content-Type': 'application/json'
                                        })
                                    })
                                        .then(res => res.json()).then(json => {
                                            if (!json?.error) {
                                                props.setActivities((activities: Activity[]) => {
                                                    (activities[activities.findIndex(x => x.id === props.selectedActivity?.id)].result as any)[Object.keys(props.selectedActivity?.delivered)[i]] = 'Accepted';
                                                    props.setSelectedActivity(activities.find(x => x.id === props.selectedActivity?.id) ?? null);
                                                    reRender(!reRenderValue);
                                                    return activities;
                                                });
                                            } else {
                                                setError(json.error);
                                            }

                                        });
                                }} />
                            </Stack.Item>
                            <Stack.Item>
                                <DefaultButton text={t('Reject')} iconProps={{ iconName: 'ChromeClose' }} disabled={(props.selectedActivity?.result as any)[Object.keys(props.selectedActivity?.delivered)[i]] !== 'Unchecked'} onClick={() => {
                                    fetch(props.domain + '/activities/result/' + props.selectedActivity?.id + '/' + Object.keys(props.selectedActivity?.delivered)[i], {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            result: 'Rejected'
                                        }),
                                        headers: new Headers({
                                            'Authorization': localStorage.getItem('token') ?? "",
                                            'School': localStorage.getItem('school') ?? "",
                                            'Content-Type': 'application/json'
                                        })
                                    })
                                        .then(res => res.json()).then(json => {
                                            if (!json?.error) {
                                                props.setActivities((activities: Activity[]) => {
                                                    (activities[activities.findIndex(x => x.id === props.selectedActivity?.id)].result as any)[Object.keys(props.selectedActivity?.delivered)[i]] = 'Rejected';
                                                    props.setSelectedActivity(activities.find(x => x.id === props.selectedActivity?.id) ?? null);
                                                    reRender(!reRenderValue);
                                                    return activities;
                                                });
                                            } else {
                                                setError(json.error);
                                            }

                                        });
                                }} />
                            </Stack.Item>
                        </Stack>
                        <DocumentCardActivity activity={new Date(thingy.date).toDateString()} people={[
                            { name: thingy.name, profileImageSrc: '' }
                        ]} />
                    </DocumentCard></Stack.Item>
                    )}</Stack></>) : null}
        </Stack>) : (
            <EditActivity domain={props.domain} info={props.info} oldActivity={props.selectedActivity} editActivity={editActivity} setEditActivity={setEditActivity}></EditActivity>)}
    </Stack>);
};

export default ReadActivity;