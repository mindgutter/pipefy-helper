'use strict';

const TEST_PIPEFY_TOKEN =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJ1c2VyIjp7ImlkIjoxNDUwMTYsImVtYWlsIjoibWluZGd1dHRlckBnbWFpbC5jb20iLCJhcHBsaWNhdGlvbiI6NDc2NX19.adUu_ASSsoDj4sYXYgaVO9zT2p-Lbe-1GiuMhpV1G--MvcsSRgX5nKEAWTR6m3gdsVezBVsGp36TO8Bj7FdQbQ';

const expect = require('chai').expect;
const pipefy = require('../index')({
    accessToken: TEST_PIPEFY_TOKEN, logLevel: 'debug'
});

const randomWord = require('random-word');

const USER_ID = 145016;

let ORGANIZATION_ID, PIPE_ID, CLONE_PIPE_ID, PIPE_RELATION_ID, LABEL_ID, PHASE_ID, NEXT_PHASE_ID, PHASE_FIELD_ID, CARD_ID, COMMENT_ID;

describe('Pipefy', () => {

    describe('#getMe', () => {
        it('should return personal info from API', async () => {
            const result = await pipefy.getMe();
            expect(result).to.have.deep.property('data.me');
        });
    });


    describe('#createOrganization', () => {
        it('should return created organization data from API', async () => {
            const result = await pipefy.createOrganization({industry: 'technology', name: 'DONT DELETE'});

            ORGANIZATION_ID = result.data.createOrganization.organization.id;
            expect(result).to.have.deep.property('data.createOrganization.organization');
        });
    });

    describe('#createPipe', () => {
        it('should return created pipe from API', async () => {
            const result = await pipefy.createPipe({
                organization_id: ORGANIZATION_ID,
                name: 'TEST PIPE',
                labels: [{
                    name: 'Single Label',
                    color: '#FF0044'
                }],
                members: [{
                    user_id: USER_ID,
                    role_name: 'admin'
                }],
                phases: [
                    {name: 'Building', done: false},
                    {name: 'Built', done: true}
                ],
                start_form_fields: [{
                    label: 'Label of Fly Proj.',
                    type_id: 'phone'
                }]
            });
            PIPE_ID = result.data.createPipe.pipe.id;
            expect(result).to.have.deep.property('data.createPipe.pipe');
        });
    });

    describe('#clonePipes', () => {
        it('should return success on clone pipe from API', async () => {
            const result = await pipefy.clonePipes({organization_id: ORGANIZATION_ID, pipe_template_ids: [PIPE_ID]});

            CLONE_PIPE_ID = result.data.clonePipes.pipes[0].id;
            expect(result).to.have.deep.property('data.clonePipes.pipes');
        });
    });

    describe('#createPipeRelation', () => {
        it('should return created pipe relation from API', async () => {
            const result = await pipefy.createPipeRelation({
                parentId: CLONE_PIPE_ID,
                childId: PIPE_ID,
                name: 'Pipe Connection',
                autoFillFieldEnabled: false,
                childMustExistToMoveParent: false,
                childMustExistToFinishParent: false,
                allChildrenMustBeDoneToFinishParent: false,
                allChildrenMustBeDoneToMoveParent: false,
                canCreateNewItems: true,
                canConnectExistingItems: true,
                canConnectMultipleItems: true
            });
            PIPE_RELATION_ID = result.data.createPipeRelation.pipeRelation.id;
            expect(result).to.have.deep.property('data.createPipeRelation.pipeRelation');
        });
    });

    describe('#createLabel', () => {
        it('should return created label from API', async () => {
            const result = await pipefy.createLabel({pipe_id: CLONE_PIPE_ID, name: 'My label', color: '#000000'});

            LABEL_ID = result.data.createLabel.label.id;
            expect(result).to.have.deep.property('data.createLabel.label');
        });
    });

    describe('#createPhase', () => {
        it('should return created phase from API', async () => {
            const result = await pipefy.createPhase({
                pipe_id: CLONE_PIPE_ID,
                name: 'To Finished',
                description: 'This phase is to be used for cards that are to be finished',
                done: false,
                only_admin_can_move_to_previous: false,
                can_receive_card_directly_from_draft: true
            });
            PHASE_ID = result.data.createPhase.phase.id;
            expect(result).to.have.deep.property('data.createPhase.phase');
        });
    });

    describe('#createPhaseField', () => {
        it('should return create phase field from API', async () => {
            const word = randomWord();
            const result = await pipefy.createPhaseField({
                phase_id: PHASE_ID,
                type: 'short_text',
                label: word,
                description: word,
                required: false,
                help: 'Fill up with text',
                editable: true,
                canConnectExisting: true,
                canConnectMultiples: true,
                sync_with_card: false
            });
            PHASE_FIELD_ID = result.data.createPhaseField.phase_field.id;
            expect(result).to.have.deep.property('data.createPhaseField.phase_field');
        });
    });

    describe('#createCard', () => {
        it('should return created card from API', async () => {
            const result = await pipefy.createCard({
                pipe_id: CLONE_PIPE_ID,
                title: 'Card created by Botkit-Inobrax',
                due_date: '2017-05-18T13:05:30-03:00',
                assignee_ids: [USER_ID],
                label_ids: [LABEL_ID]
            });
            CARD_ID = result.data.createCard.card.id;
            expect(result).to.have.deep.property('data.createCard.card');
        });
    });

    /*
    describe('#updateCardField', () => {
        it('should return update card field from API', async () => {
            const result = await pipefy.updateCardField({
                card_id: CARD_ID,
                field_id: PHASE_FIELD_ID,
                new_value: "+1512947654"
            });
            expect(result).to.have.deep.property('data.updateCardField.success');
        });
    });
    */

    describe('#createComment', () => {
        it('should return created comment from API', async () => {
            const result = await pipefy.createComment({card_id: CARD_ID, text: 'I added this comment'});

            COMMENT_ID = result.data.createComment.comment.id;
            expect(result).to.have.deep.property('data.createComment.comment');
        });
    });

    describe('#getOrganizations', () => {
        it('should return organizations list from API', async () => {
            const result = await pipefy.getOrganizations();

            expect(result).to.have.deep.property('data.organizations');
        });
    });

    describe('#getOrganizationById', () => {
        it('should return organization data by id from API', async () => {
            const result = await pipefy.getOrganizationById(ORGANIZATION_ID);

            expect(result).to.have.deep.property('data.organization');
        });
    });

    describe('#getPipesByIds', () => {
        it('should return pipes data by ids from API', async () => {
            const result = await pipefy.getPipesByIds([PIPE_ID, CLONE_PIPE_ID]);

            expect(result).to.have.deep.property('data.pipes');
        });
    });

    describe('#getPipeById', () => {
        it('should return pipe data by id from API', async () => {
            const result = await pipefy.getPipeById(PIPE_ID);

            expect(result).to.have.deep.property('data.pipe');
        });
    });

    describe('#getPhaseById', () => {
        it('should return phase data by id from API', async () => {
            const result = await pipefy.getPhaseById(PHASE_ID);

            expect(result).to.have.deep.property('data.phase');
        });
    });

    describe('#getCardsByPipeId', () => {
        it('should return cards data by pipe id from API', async () => {
            const result = await pipefy.getCardsByPipeId(PIPE_ID);

            expect(result).to.have.deep.property('data.cards');
        });
    });

    describe('#getCardById', () => {
        it('should return card data by id from API', async () => {
            const result = await pipefy.getCardById(CARD_ID);
            expect(result).to.have.deep.property('data.card');
        });
    });

    describe('#getPipeRelationByIds', () => {
    it('should return pipe realtion by ids from API', async () => {
        const result = await pipefy.getPipeRelationByIds([PIPE_ID, CLONE_PIPE_ID]);

        expect(result).to.have.deep.property('data.pipe_relations');

    });
});

    describe('#updateOrganization', () => {
    it('should return updated organization data from API', async () => {
        const result = await pipefy.updateOrganization({
            id: ORGANIZATION_ID,
            name: 'Capsule Corp.',
            only_admin_can_invite_users: false,
            only_admin_can_create_pipes: false,
            force_omniauth_to_normal_users: false
        });
        expect(result).to.have.deep.property('data.updateOrganization.organization');
    });
});

    describe('#updatePipe',  () => {
    it('should return updated pipe from API', async () => {
        const result = await pipefy.updatePipe({
            id: CLONE_PIPE_ID,
            name: 'Cao Project',
            anyone_can_create_card: true,
            public: true,
            only_admin_can_remove_cards: false,
            only_assignees_can_edit_cards: false
        });
        expect(result).to.have.deep.property('data.updatePipe.pipe');
    });
});

    describe('#updatePhase',  () => {
    it('should return updated phase from API', async () => {
        const result = await pipefy.updatePhase({
            id: PHASE_ID,
            name: 'Available to test',
            can_receive_card_directly_from_draft: true,
            description: 'Im editing this phase'
        });
        expect(result).to.have.deep.property('data.updatePhase.phase');
    });
});


    describe('#updatePhaseField', async () =>  {
      it('should return updated phase field from API', async () =>  {
          const word = randomWord();
        const result = await pipefy.updatePhaseField({
          id: PHASE_FIELD_ID,
          label: word,
          help: 'Fill this field with paid value (R$)',
          description: 'The Paid Value with currency symbol'
        });
        expect(result).to.have.deep.property('data.updatePhaseField.phase_field');
      });
    });


    describe('#updateLabel',  () => {
    it('should return updated label from API', async () => {
        const result = await pipefy.updateLabel({id: LABEL_ID, color: '#000000', name: 'Changed Name Label'});

        expect(result).to.have.deep.property('data.updateLabel.label');
    });
});

    describe('#updateCard',  () => {
    it('should return updated card from API', async () => {
        const result = await pipefy.updateCard({
            id: CARD_ID,
            title: 'New Test Card',
            due_date: '2017-01-10T11:15:06-02:00',
            assignee_ids: [USER_ID],
            label_ids: [LABEL_ID]
        });
        expect(result).to.have.deep.property('data.updateCard.card');
    });
});

    describe('#updateComment', () => {
    it('should return updated comment from API', async () => {
        const result = await pipefy.updateComment({id: COMMENT_ID, text: 'Edit: Im editing this comment'});
        expect(result).to.have.deep.property('data.updateComment.comment');
    });
});

    describe('#updatePipeRelation',  () => {
    it('should return updated pipe relation from API', async () => {
        const result = await pipefy.updatePipeRelation({
            id: PIPE_RELATION_ID,
            name: 'Edit: Pipe Connection',
            autoFillFieldEnabled: false,
            allChildrenMustBeDoneToFinishParent: false,
            allChildrenMustBeDoneToMoveParent: false,
            canConnectExistingItems: true,
            canConnectMultipleItems: true,
            canCreateNewItems: true,
            childMustExistToFinishParent: false,
            childMustExistToMoveParent: false
        });
        expect(result).to.have.deep.property('data.updatePipeRelation.pipeRelation');
    });
});

    describe('#moveCardToPhase', () => {
    it('should return moved card from API', async () => {
            const card = await pipefy.getCardById(CARD_ID);
            NEXT_PHASE_ID = card.data.card.current_phase.cards_can_be_moved_to_phases[0].id;
            const result = await pipefy.moveCardToPhase({card_id: CARD_ID, destination_phase_id: NEXT_PHASE_ID});
            expect(result).to.have.deep.property('data.moveCardToPhase.card');
        });
    });

    describe('#setRole', () => {
        it('should return member with new role from API', async () => {
            const result = await pipefy.setRole({
                pipe_id: CLONE_PIPE_ID,
                organization_id: ORGANIZATION_ID,
                member: {user_id: USER_ID, role_name: 'admin'}
            });
            expect(result).to.have.deep.property('data.setRole.member');
        });
    });

    describe('#deleteComment', () => {
        it('should return success on delete comment from API', async () => {
            const result = await pipefy.deleteComment(COMMENT_ID);
            expect(result).to.have.deep.property('data.deleteComment.success');
        });
    });

    describe('#deleteCard', () => {
        it('should return success on delete card from API', async () => {
            const result = await pipefy.deleteCard(CARD_ID);

            expect(result).to.have.deep.property('data.deleteCard.success');
        });
    });

    describe('#deletePhaseField', () => {
        it('should return success on delete phase field from API', async () => {
            const result = await pipefy.deletePhaseField(PHASE_FIELD_ID);
            expect(result).to.have.deep.property('data.deletePhaseField.success');
        });
    });

    describe('#deletePhase', () => {
        it('should return success on delete phase from API', async () => {
            const result = await pipefy.deletePhase(PHASE_ID);
            expect(result).to.have.deep.property('data.deletePhase.success');
        });
    });

    describe('#deleteLabel', () => {
        it('should return success on delete label from API', async () => {
            const result = await pipefy.deleteLabel(LABEL_ID);
            expect(result).to.have.deep.property('data.deleteLabel.success');
        });
    });

    describe('#deletePipeRelation', () => {
        it('should return success on delete pipe relation from API', async () => {
            const result = await pipefy.deletePipeRelation(PIPE_RELATION_ID);
            expect(result).to.have.deep.property('data.deletePipeRelation.success');
        });
    });

    describe('#deletePipe', () => {
        it('should return success on delete pipe from API', async () => {
            const result = await pipefy.deletePipe(CLONE_PIPE_ID);
            expect(result).to.have.deep.property('data.deletePipe.success');
        });
    });

    describe('#deleteOrganization', () => {
        it('should return success on delete organization from API', async () => {
            const result = await pipefy.deleteOrganization(ORGANIZATION_ID);
            expect(result).to.have.deep.property('data.deleteOrganization.success');
        });
    });

});
