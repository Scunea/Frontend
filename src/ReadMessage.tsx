import React, { useEffect, useState } from 'react';
import { Stack, Text, IconButton, Dialog as DialogMS, DialogType, DialogFooter as DialogFooterMS, PrimaryButton, DefaultButton, IDialogFooterProps, IDialogProps, MessageBar, MessageBarType } from '@fluentui/react';
import { useBoolean } from '@fluentui/react-hooks';
import { NeutralColors } from '@fluentui/theme';
import EditMessage from './EditMessage';
import { IdPlusName, Message, User } from './interfaces';
import { useTranslation } from 'react-i18next';

const ReadMessage = (props: { domain: string | undefined; messages: Message[]; selectedMessage: Message; setSelectedMessage: (value: React.SetStateAction<Message | null>) => void; info: User; }) => {

    const Dialog = (props: IDialogProps & { children: any }) => {
        return <DialogMS {...props}></DialogMS>;
    };

    const DialogFooter = (props: IDialogFooterProps & { children: any }) => {
        return <DialogFooterMS {...props}></DialogFooterMS>;
    };

    const [reRenderValue, reRender] = useState(true);
    const [hideDeleteDialog, { toggle: toggleHideDeleteDialog }] = useBoolean(true);
    const [editMessage, setEditMessage] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        props.setSelectedMessage(props.messages.find((x: any) => x.id === props.selectedMessage?.id) ?? null);
        reRender(!reRenderValue);
    }, [props.messages]);

    const { t } = useTranslation();

    return (<Stack>
        <Stack horizontal>
            {props.selectedMessage?.author.id === props.info?.id || props.info?.administrator ? <><Stack.Item>
                <IconButton iconProps={{ iconName: 'Delete' }} onClick={() => toggleHideDeleteDialog()} />
                <Dialog hidden={hideDeleteDialog} onDismiss={toggleHideDeleteDialog} dialogContentProps={{
                    type: DialogType.largeHeader,
                    title: t('Delete message?'),
                    subText: t('Do you want to delete this message?'),
                }}>
                    {error ? <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')} >
                        {t(error)}
                    </MessageBar> : null}
                    <DialogFooter>
                        <PrimaryButton onClick={() => {
                            fetch(props.domain + '/messages/' + props.selectedMessage?.id, {
                                method: 'DELETE',
                                headers: new Headers({
                                    'Authorization': localStorage.getItem('token') ?? "",
                                    'School': localStorage.getItem('school') ?? ""
                                })
                            }).then(res => res.json()).then(json => {
                                if (!json?.error) {
                                    toggleHideDeleteDialog();
                                    props.setSelectedMessage(null);
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
                    <IconButton iconProps={{ iconName: editMessage ? 'View' : 'Edit' }} onClick={() => setEditMessage(!editMessage)} />
                </Stack.Item></> : null}
            <Stack.Item styles={{
                root: {
                    position: 'absolute',
                    right: 0
                }
            }}>
                <IconButton iconProps={{ iconName: 'ChromeClose' }} onClick={() => {
                    props.setSelectedMessage(null);
                }} />
            </Stack.Item>
        </Stack>
        {!editMessage ? (<Stack styles={{
            root: {
                padding: 25
            }
        }}>
            <Stack.Item>
                <Text>{t('From somebody to somebody', { from: props.selectedMessage?.author.name, to: props.selectedMessage?.receiver.map((x: IdPlusName) => x.name).join(', ') })}</Text>
            </Stack.Item>
            <Stack.Item>
                <Text variant="smallPlus" styles={{
                    root: {
                        color: NeutralColors.gray130
                    }
                }}>{new Date(Number(props.selectedMessage?.date)).toDateString()}</Text>
            </Stack.Item>
            <Stack.Item>
                <Text variant="large">{props.selectedMessage?.title}</Text>
            </Stack.Item>
            {(props.selectedMessage?.files?.length ?? 0) > 0 ? <Stack.Item styles={{
                root: {
                    backgroundColor: NeutralColors.gray50,
                    width: '100%',
                    padding: 5,
                    overflow: 'auto'
                }
            }}>
                {props.selectedMessage?.files?.map((file: IdPlusName) => <DefaultButton key={file.id} onClick={() => {
                    let clicky = document.createElement('a');
                    clicky.href = props.domain + '/static/' + file.id + '?name=' + file.name;
                    clicky.download = file.name;
                    clicky.click();
                }}>{file.name}</DefaultButton>)}
            </Stack.Item> : null}
            <Stack.Item>
                {!props.selectedMessage?.pdf ? <div dangerouslySetInnerHTML={{ __html: props.selectedMessage?.content ?? '' }}></div> : <iframe src={props.domain + '/static/' + props.selectedMessage?.pdf} style={{
                    width: '100%',
                    minHeight: 500
                }}></iframe>}
            </Stack.Item>
        </Stack>) : <EditMessage domain={props.domain} info={props.info} oldMessage={props.selectedMessage} editMessage={editMessage} setEditMessage={setEditMessage}></EditMessage>}
    </Stack>);
};

export default ReadMessage;