import React, { createRef, useState } from 'react';
import { Stack, IconButton, TextField, DefaultButton, PrimaryButton } from '@fluentui/react';
import { User } from './interfaces';
import { useTranslation } from 'react-i18next';

const NewReport = (props: { domain: string | undefined; info: User; newReport: boolean; setNewReport: (value: React.SetStateAction<boolean>) => void; }) => {

    const newReportInput = createRef<HTMLInputElement>();

    const [newReportTitle, setNewReportTitle] = useState('');
    const [newReportFile, setNewReportFile] = useState<File | null>(null);

    const { t } = useTranslation();

    return (
        <Stack>
            <Stack styles={{
                root: {
                    position: 'absolute',
                    right: 0
                }
            }}>
                <Stack.Item>
                    <IconButton iconProps={{ iconName: 'ChromeClose' }} onClick={() => props.setNewReport(false)} />
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
                    <TextField placeholder={t('Title')} value={newReportTitle} underlined onChange={(event, value) => setNewReportTitle(value ?? '')}></TextField>
                </Stack.Item>
                <Stack.Item>
                    <Stack horizontal styles={{
                        root: {
                            justifyContent: 'space-between'
                        }
                    }}>
                        <Stack.Item>
                            <PrimaryButton text={t('Send report')} iconProps={{ iconName: 'Send' }} onClick={() => {
                                if (newReportFile) {
                                    const form = new FormData();
                                    form.append('upload', newReportFile);
                                    fetch(props.domain + '/upload', {
                                        method: 'POST',
                                        body: form,
                                        headers: new Headers({
                                            'Authorization': localStorage.getItem('token') ?? "",
                                            'School': localStorage.getItem('schoolId') ?? ""
                                        })
                                    }).then(res => res.json()).then(json => {
                                        fetch(props.domain + '/reports', {
                                            method: 'POST',
                                            body: JSON.stringify({
                                                title: newReportTitle,
                                                file: { id: json.id, name: newReportFile.name },
                                            }),
                                            headers: new Headers({
                                                'Authorization': localStorage.getItem('token') ?? "",
                                                'School': localStorage.getItem('schoolId') ?? "",
                                                'Content-Type': 'application/json'
                                            })
                                        })
                                            .then(res => {
                                                if (res.status === 201) {
                                                    setNewReportTitle('');
                                                    setNewReportFile(null);
                                                    props.setNewReport(false);
                                                }
                                            });
                                    });
                                }
                            }} disabled={!(newReportTitle?.length > 0 && newReportFile !== null)} />
                        </Stack.Item>
                        <Stack.Item>
                            <input type="file" ref={newReportInput} style={{
                                display: 'none'
                            }} onChange={event => {
                                setNewReportFile((event.target.files ?? [])[0]);
                            }} />
                            {!newReportFile ? <DefaultButton text={t('Add attachment')} iconProps={{ iconName: 'Attach' }} onClick={() => {
                                newReportInput.current?.click();
                            }} /> : <DefaultButton text={t('Remove attachment (something)', { attachment: newReportFile.name })} iconProps={{ iconName: 'Attach' }} onClick={() => {
                                setNewReportFile(null);
                            }} />}
                        </Stack.Item>
                    </Stack>
                </Stack.Item>
            </Stack>
        </Stack>
    );
};

export default NewReport;