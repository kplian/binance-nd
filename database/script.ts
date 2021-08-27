/**
 * Kplian Ltda 2020
 *
 * MIT
 *
 * This files contains data to be added to database for pxp module money manager
 *
 * @summary DML should be added here
 * @author Favio Figueroa
 *
 * Created at     : 2021-02-15 16:31:21
 */


import { ScriptInterface } from '@pxp-nd/core';
import { Role } from '@pxp-nd/entities';
import { Subsystem } from '@pxp-nd/entities';
import { Ui } from '@pxp-nd/entities';

const scriptsArray: ScriptInterface[] = [];

/***************************
 * ADD YOUR SCRIPTS HERE
 ***************************/

scriptsArray.push({
  scriptCode: 'FFP-PXP-20210215-005', scriptFunction: async (em) => {

    const subsystem = new Subsystem();
    subsystem.name = 'BIN';
    subsystem.code = 'BIN';
    subsystem.folderName = 'BIN';
    subsystem.prefix = 'BIN';
    subsystem.createdBy = 'admin';
    await em.save(subsystem);

    const role = new Role();
    role.role = 'admin';
    role.description = 'Pxp Administrator (equals to root)';
    role.createdBy = 'admin';
    role.subsystem = subsystem;
    await em.save(role);

    const ui = new Ui();
    ui.code = 'BIN';
    ui.name = 'BIN (root ui)';
    ui.description = 'This should not show in menu all subsystems depend on this';
    ui.subsystem = subsystem;
    ui.createdBy = 'admin';
    ui.parentId = 1;
    await em.save(ui);

    const uiMainMenuMM = new Ui();
    uiMainMenuMM.code = 'BIN_MENU';
    uiMainMenuMM.name = 'Binance';
    uiMainMenuMM.description = 'BIN Menu';
    uiMainMenuMM.subsystem = subsystem;
    uiMainMenuMM.createdBy = 'admin';
    uiMainMenuMM.parentId = ui.uiId;
    await em.save(uiMainMenuMM);

    const uiAccountType = new Ui();
    uiAccountType.code = 'BIN_SIGNAL';
    uiAccountType.name = 'Signal';
    uiAccountType.description = 'Signal';
    uiAccountType.subsystem = subsystem;
    uiAccountType.route = 'BIN_SIGNAL';
    uiAccountType.createdBy = 'admin';
    uiAccountType.order = 1;
    uiAccountType.parentId = uiMainMenuMM.uiId;
    await em.save(uiAccountType);
  }
});

scriptsArray.push({
  scriptCode: 'RCM-BIN-20210512-001', scriptFunction: async (em) => {

    const subsystem = await Subsystem.findOne({ code: "BIN" });
    const rootUi = await Ui.findOne({ code: "BIN_MENU" });

    const uiMenu = new Ui();
    uiMenu.code = 'BIN_ALERT';
    uiMenu.name = 'Alert';
    uiMenu.description = 'Alerts';
    uiMenu.subsystem = subsystem as Subsystem;
    uiMenu.route = 'BIN_ALERT';
    uiMenu.createdBy = 'admin';
    uiMenu.order = 1;
    uiMenu.parentId = rootUi ? rootUi.uiId : 0;
    await em.save(uiMenu);
  }
});

export default scriptsArray;