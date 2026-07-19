module.exports = {
    config: {
        name: "groupe",
        aliases: ["makegroup", "newgroup", "cg"],
        version: "3.0",
        author: "olua",
        countDown: 10,
        role: 0,
        shortDescription: {
            fr: "Crée un groupe et y ajoute jusqu'à 30 membres du chat actuel."
        },
        longDescription: {
            fr: "Crée un salon avec le créateur + un membre requis, le nomme admin, puis ajoute progressivement jusqu'à 30 membres du groupe actuel."
        },
        category: "box",
        guide: {
            fr: "• creergroupe [Nom du nouveau groupe]"
        }
    },

    onChat: async function({ api, event, message, args }) {
        if (!event.body) return;
        const msg = event.body.toLowerCase().trim();
        const trigger = msg.split(" ")[0];

        if (trigger === "creergroupe" || this.config.aliases.includes(trigger)) {
            const newArgs = event.body.split(" ").slice(1);
            return this.onStart({ api, event, args: newArgs, message });
        }
    },

    onStart: async function({ api, event, args, message }) {
        const senderID = event.senderID;
        const threadID = event.threadID;
        const groupName = args.join(" ").trim();

        if (!event.isGroup) {
            return message.reply("⚠️ Cette commande doit être lancée dans un groupe pour pouvoir copier ses membres.");
        }

        if (!groupName) {
            return message.reply("⚠️ Spécifie un nom.\nExemple : creergroupe Mon Grand Salon");
        }

        try {
            const threadInfo = await api.getThreadInfo(threadID);
            let allMembers = threadInfo.participantIDs;
            const botID = api.getCurrentUserID();

            allMembers = allMembers.filter(id => id!== botID && id!== senderID);

            if (allMembers.length === 0) {
                return message.reply("❌ Il n'y a pas assez de membres différents dans ce chat pour initialiser un groupe.");
            }

            const firstPartner = allMembers.shift();
            const initialParticipants = [senderID, firstPartner];

            const extraMembers = allMembers.slice(0, 30);

            message.reply(`🏗️ Initialisation du groupe "${groupName}"...\n👥 ${extraMembers.length + 1} membres prévus pour l'invitation.`);

            api.createNewGroup(initialParticipants, groupName, async (err, newThreadID) => {
                if (err) {
                    console.error(err);
                    return message.reply("❌ L'API Facebook a refusé la création du groupe.");
                }

                await new Promise(resolve => setTimeout(resolve, 2000));

                try {
                    await api.changeAdminStatus(newThreadID, senderID, true);
                } catch (e) {
                    console.error("Impossible de mettre admin:", e);
                }

                message.reply(`✅ Salon créé (ID: ${newThreadID}) et couronne attribuée! 👑\n✈️ Ajout des membres en cours...`);

                let successCount = 1;

                for (const memberID of extraMembers) {
                    try {
                        await api.addUserToGroup(memberID, newThreadID);
                        successCount++;
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    } catch (addError) {
                        console.error(`Échec ajout pour ${memberID}:`, addError);
                    }
                }

                return message.reply(`🎉 Opération terminée!\n👑 Salon : ${groupName}\n👥 Membres transférés avec succès : ${successCount}/${extraMembers.length + 1}`);
            });

        } catch (error) {
            console.error(error);
            return message.reply("❌ Une erreur technique est survenue.");
        }
    }
};
